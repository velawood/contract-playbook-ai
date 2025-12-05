
import { ShadowDocument, Paragraph } from '../types';
import { MOCK_DOC_CONTENT } from '../constants';

// Declare globals loaded via CDN
declare var mammoth: any;
declare var JSZip: any;

interface NumberingLevel {
    start: number;
    fmt: string; // 'decimal', 'lowerLetter', 'upperRoman', etc.
    lvlText: string; // e.g., "%1.%2"
}

interface AbstractNum {
    levels: Map<number, NumberingLevel>;
}

/**
 * A dedicated parser that reads raw OpenXML (word/document.xml, word/numbering.xml)
 * to accurately reconstruct document structure and numbering without "inference".
 */
class DocxParser {
    private zip: any;
    private numberingMap = new Map<string, string>(); // numId -> abstractNumId
    private abstractNumMap = new Map<string, AbstractNum>(); // abstractNumId -> definitions
    // numId -> [counter_lvl0, counter_lvl1, ...]
    private listCounters = new Map<string, number[]>(); 

    constructor() {}

    async parse(file: File): Promise<ShadowDocument> {
        this.zip = await JSZip.loadAsync(file);
        
        // 1. Parse Numbering Definitions (if they exist)
        await this.loadNumbering();

        // 2. Parse Main Document Content
        const paragraphs = await this.parseDocument();

        return {
            metadata: {
                filename: file.name,
                timestamp: new Date().toISOString()
            },
            paragraphs: paragraphs
        };
    }

    private async loadNumbering() {
        const numberingFile = this.zip.file("word/numbering.xml");
        if (!numberingFile) return; // No numbered lists

        const xmlText = await numberingFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        // 1. Map numId to abstractNumId
        // <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
        const nums = xmlDoc.getElementsByTagName("w:num");
        for (let i = 0; i < nums.length; i++) {
            const numId = nums[i].getAttribute("w:numId");
            const abstractRef = nums[i].getElementsByTagName("w:abstractNumId")[0];
            if (numId && abstractRef) {
                this.numberingMap.set(numId, abstractRef.getAttribute("w:val") || "");
            }
        }

        // 2. Parse Abstract Numbering Definitions
        // <w:abstractNum w:abstractNumId="0"> ... <w:lvl w:ilvl="0"> ... </w:abstractNum>
        const abstractNums = xmlDoc.getElementsByTagName("w:abstractNum");
        for (let i = 0; i < abstractNums.length; i++) {
            const abstractId = abstractNums[i].getAttribute("w:abstractNumId");
            if (!abstractId) continue;

            const levels = new Map<number, NumberingLevel>();
            const lvlNodes = abstractNums[i].getElementsByTagName("w:lvl");
            
            for (let j = 0; j < lvlNodes.length; j++) {
                const lvlNode = lvlNodes[j];
                const ilvl = parseInt(lvlNode.getAttribute("w:ilvl") || "0");
                
                const startNode = lvlNode.getElementsByTagName("w:start")[0];
                const numFmtNode = lvlNode.getElementsByTagName("w:numFmt")[0];
                const lvlTextNode = lvlNode.getElementsByTagName("w:lvlText")[0];

                levels.set(ilvl, {
                    start: parseInt(startNode?.getAttribute("w:val") || "1"),
                    fmt: numFmtNode?.getAttribute("w:val") || "decimal",
                    lvlText: lvlTextNode?.getAttribute("w:val") || "%1"
                });
            }

            this.abstractNumMap.set(abstractId, { levels });
        }
    }

    private async parseDocument(): Promise<Paragraph[]> {
        const docFile = this.zip.file("word/document.xml");
        if (!docFile) throw new Error("Invalid docx: missing word/document.xml");

        const xmlText = await docFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const paragraphs: Paragraph[] = [];
        const pNodes = xmlDoc.getElementsByTagName("w:p");

        for (let i = 0; i < pNodes.length; i++) {
            const pNode = pNodes[i];
            
            // Extract Text
            let text = "";
            const runs = pNode.getElementsByTagName("w:r");
            for (let r = 0; r < runs.length; r++) {
                const tNodes = runs[r].getElementsByTagName("w:t");
                for (let t = 0; t < tNodes.length; t++) {
                    text += tNodes[t].textContent;
                }
            }
            
            // Skip empty paragraphs that are not structural (optional: can be adjusted)
            if (!text.trim()) continue;

            // Extract Style
            const pPr = pNode.getElementsByTagName("w:pPr")[0];
            let style = "Normal";
            let outlineLevel = 0;

            if (pPr) {
                const pStyle = pPr.getElementsByTagName("w:pStyle")[0];
                if (pStyle) {
                    const styleVal = pStyle.getAttribute("w:val");
                    if (styleVal) {
                        // Normalize Word style IDs (Heading1 -> Heading 1)
                        if (styleVal.toLowerCase().startsWith("heading")) {
                            const level = styleVal.replace(/[^0-9]/g, '');
                            if (level) {
                                style = `Heading ${level}`;
                                outlineLevel = parseInt(level);
                            } else {
                                style = styleVal;
                            }
                        } else if (styleVal === 'ListParagraph') {
                             style = 'List Paragraph';
                        } else {
                            style = styleVal;
                        }
                    }
                }
            }

            // Extract / Calculate Numbering
            let numberingPrefix = "";
            if (pPr) {
                const numPr = pPr.getElementsByTagName("w:numPr")[0];
                if (numPr) {
                    const numIdNode = numPr.getElementsByTagName("w:numId")[0];
                    const ilvlNode = numPr.getElementsByTagName("w:ilvl")[0];
                    
                    const numId = numIdNode?.getAttribute("w:val");
                    const ilvl = parseInt(ilvlNode?.getAttribute("w:val") || "0");

                    if (numId) {
                        numberingPrefix = this.calculateNumbering(numId, ilvl);
                    }
                }
            }

            paragraphs.push({
                id: `docx_para_${i}`,
                text: `${numberingPrefix}${text}`,
                original_text: `${numberingPrefix}${text}`, // Init for change tracking
                style: style,
                outline_level: outlineLevel,
                status: 'original'
            });
        }

        return paragraphs;
    }

    private calculateNumbering(numId: string, ilvl: number): string {
        const abstractId = this.numberingMap.get(numId);
        if (!abstractId) return "";

        const abstractNum = this.abstractNumMap.get(abstractId);
        if (!abstractNum) return "";

        const levelDef = abstractNum.levels.get(ilvl);
        if (!levelDef) return "";

        // Initialize counters for this specific list instance if needed
        if (!this.listCounters.has(numId)) {
            this.listCounters.set(numId, []);
        }
        
        const counters = this.listCounters.get(numId)!;
        
        // Ensure counters array is big enough
        for (let i = counters.length; i <= ilvl; i++) {
            // Check default start value for this level
            const def = abstractNum.levels.get(i);
            counters[i] = (def ? def.start : 1) - 1; 
        }

        // Increment current level
        counters[ilvl]++;

        // Reset lower levels (higher indices)
        for (let i = ilvl + 1; i < 9; i++) {
             const def = abstractNum.levels.get(i);
             if (def) counters[i] = def.start - 1;
             else counters[i] = 0;
        }

        // Format string (e.g., "%1.%2.")
        // Replaces %1 with counter[0], %2 with counter[1]...
        let result = levelDef.lvlText;
        
        // Word uses %1, %2... Regex replace
        result = result.replace(/%(\d+)/g, (match, lvlIndexStr) => {
            const lvlIndex = parseInt(lvlIndexStr) - 1; // 1-based in string, 0-based in array
            if (lvlIndex < 0 || lvlIndex >= counters.length) return match;
            
            const val = counters[lvlIndex];
            // Format the number based on the definition for THAT level
            const targetLevelDef = abstractNum.levels.get(lvlIndex);
            return this.formatValue(val, targetLevelDef?.fmt || 'decimal');
        });

        return result + "\t"; // Append tab usually present in Word
    }

    private formatValue(val: number, fmt: string): string {
        switch (fmt) {
            case 'decimal': return val.toString();
            case 'lowerLetter': return String.fromCharCode(96 + val); // a, b, c...
            case 'upperLetter': return String.fromCharCode(64 + val); // A, B, C...
            case 'lowerRoman': return this.toRoman(val).toLowerCase();
            case 'upperRoman': return this.toRoman(val);
            case 'bullet': return "•";
            default: return val.toString();
        }
    }

    private toRoman(num: number): string {
        const lookup: Record<string, number> = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
        let roman = '';
        for (let i in lookup ) {
            while ( num >= lookup[i] ) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    }
}


/**
 * This service simulates the Office.js / Word JavaScript API.
 * In production, this would use `Word.run(...)`.
 */
class WordAdapter {
  private docState: ShadowDocument;
  private docxParser: DocxParser;

  constructor() {
    this.docState = JSON.parse(JSON.stringify(MOCK_DOC_CONTENT));
    this.docxParser = new DocxParser();
  }

  // Simulates context.document.body.paragraphs.load()
  async scanDocument(): Promise<ShadowDocument> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.docState);
      }, 800);
    });
  }

  // NEW: Parses the uploaded file to create a real ShadowDocument
  async loadFromFile(file: File): Promise<ShadowDocument> {
    console.log(`Word Adapter: Loading file ${file.name}`);
    
    // Reset parser state for new file
    this.docxParser = new DocxParser();

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx')) {
      // Use the new Robust XML Parser
      try {
          const doc = await this.docxParser.parse(file);
          this.docState = doc;
          return doc;
      } catch (e) {
          console.error("Native XML Parse failed, falling back to basic...", e);
          return this.parseDocxFallback(file);
      }
    } else if (fileName.endsWith('.json')) {
      return this.parseJson(file);
    } else {
      return this.parseSimulatedPdf(file);
    }
  }

  private async parseJson(file: File): Promise<ShadowDocument> {
      try {
          const text = await file.text();
          const doc = JSON.parse(text);
          if (!doc.paragraphs || !Array.isArray(doc.paragraphs)) {
              throw new Error("Invalid JSON structure: Missing paragraphs array.");
          }
          this.docState = doc;
          return doc;
      } catch (error) {
          console.error("Error parsing JSON", error);
          alert("Failed to parse JSON contract.");
          return this.docState;
      }
  }

  // Fallback using Mammoth if XML parsing fails critically
  private async parseDocxFallback(file: File): Promise<ShadowDocument> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer }, { ignoreEmptyParagraphs: false });
        // Minimal fallback
        const newDoc = {
            metadata: { filename: file.name, timestamp: new Date().toISOString() },
            paragraphs: [{ id: 'err', text: "Error parsing document structure. Text extracted via fallback: " + result.value.replace(/<[^>]*>/g, ' '), style: 'Normal', outline_level: 0, status: 'original' as const }]
        };
        this.docState = newDoc;
        return newDoc;
    } catch (error) {
        console.error("Fallback parsing failed", error);
        return this.docState;
    }
  }

  private async parseSimulatedPdf(file: File): Promise<ShadowDocument> {
    const paragraphs: Paragraph[] = [];
    const baseText = "This is a simulated clause from the PDF document to demonstrate analysis capability. ";
    for(let i=0; i<50; i++) {
        paragraphs.push({
            id: `pdf_para_${i}`,
            text: `${i + 1}. ${baseText} The Provider shall ensure compliance with all applicable laws.`,
            style: 'Normal',
            outline_level: 0,
            status: 'original'
        });
    }
    const newDoc = {
        metadata: { filename: file.name, timestamp: new Date().toISOString() },
        paragraphs: paragraphs
    };
    this.docState = newDoc;
    return newDoc;
  }

  async scrollToParagraph(id: string): Promise<void> {
    console.log(`Word API: Scrolling to paragraph ${id}`);
    const element = document.getElementById(`doc-para-${id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  async applyPatch(id: string, newText: string): Promise<ShadowDocument> {
    console.log(`Word API: Applying patch to ${id}`);
    
    const index = this.docState.paragraphs.findIndex(p => p.id === id);
    if (index !== -1) {
      const p = this.docState.paragraphs[index];
      
      // Store original text if this is the first edit
      if (!p.original_text) {
          p.original_text = p.text;
      }
      
      p.text = newText;
      p.status = 'modified'; 
    }
    
    return { ...this.docState };
  }
}

export const wordAdapter = new WordAdapter();
