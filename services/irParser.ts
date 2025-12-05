
import { AnalysisFinding, RiskLevel } from '../types';

export interface IRParsedClause {
    id: string;
    originalText: string;
    issue: string;
    risk: string;
    reasoning: string;
    suggestedRewrite: string;
    parseError?: string;
}

/**
 * Parses raw LLM output text in the custom Intermediate Representation (IR) format.
 * 
 * ROBUSTNESS UPGRADE:
 * Instead of a strict regex that requires matching <<END_CLAUSE>>, this parser
 * splits the stream by start tags. This allows it to recover content even if
 * the LLM truncates the output or forgets the closing tag (Soft Fail).
 */
export const parseIR = (text: string): IRParsedClause[] => {
    const results: IRParsedClause[] = [];
    
    // Normalize newlines
    const cleanText = text.replace(/\r\n/g, '\n');

    // 1. Split by '<<CLAUSE' to get potential blocks
    // This is more robust than matching pairs because it handles nested/missing tags better
    const rawBlocks = cleanText.split(/<<CLAUSE\s+/);
    
    // Skip the first split as it's usually preamble text before the first clause
    for (let i = 1; i < rawBlocks.length; i++) {
        const block = rawBlocks[i];
        
        // Block structure expected: 'id="ID">> content... <<END_CLAUSE>> ...'
        
        // 2. Extract ID
        // We look for 'id="XYZ">>' at the start of the block
        const idMatch = block.match(/^id="([^"]+)">>/);
        if (!idMatch) {
             console.warn("IR Parser: Found clause block start but missing valid ID marker");
             continue; 
        }
        const id = idMatch[1];
        
        // 3. Extract Content & Handle Missing End Tag
        let content = "";
        let parseError = undefined;

        const headerLength = idMatch[0].length;
        const endTagIndex = block.indexOf("<<END_CLAUSE>>");

        if (endTagIndex !== -1) {
            // Perfect case: End tag exists
            content = block.substring(headerLength, endTagIndex);
        } else {
            // Failure case: Missing End Tag (Truncation or hallucination)
            // Strategy: Take everything until end of string (or next split, but split() handles that)
            content = block.substring(headerLength);
            parseError = "Missing <<END_CLAUSE>> tag. Content recovered until end of block.";
        }

        // 4. Extract Sections
        const sections = extractSections(content);
        
        results.push({
            id,
            originalText: sections['ORIGINAL']?.trim() || "",
            issue: sections['ISSUE']?.trim() || "General Issue",
            risk: sections['RISK']?.trim() || "YELLOW",
            reasoning: sections['REASONING']?.trim() || "No reasoning provided.",
            suggestedRewrite: sections['SUGGESTED_REWRITE']?.trim() || "",
            parseError
        });
    }

    return results;
};

const extractSections = (content: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    const headers = ['RISK', 'ISSUE', 'ORIGINAL', 'REASONING', 'SUGGESTED_REWRITE'];
    
    // Escape headers for regex
    const headerPattern = headers.map(h => `\\[${h}\\]`).join('|');
    // Regex to capture text between headers
    const regex = new RegExp(`(${headerPattern})([\\s\\S]*?)(?=(?:\\[(?:${headers.join('|')})\\])|$)`, 'g');

    let match;
    while ((match = regex.exec(content)) !== null) {
        const header = match[1].replace(/[\[\]]/g, ''); // Remove [ ]
        const body = match[2].trim();
        sections[header] = body;
    }

    return sections;
};

export const mapIRToFindings = (parsed: IRParsedClause[]): AnalysisFinding[] => {
    return parsed.map(p => {
        // Inject parser warnings into reasoning so they are visible in UI and Tests
        let finalReasoning = p.reasoning;
        if (p.parseError) {
            finalReasoning += `\n\n[SYSTEM WARNING: ${p.parseError}]`;
        }
        
        return {
            target_id: p.id,
            issue_type: p.issue,
            risk_level: normalizeRisk(p.risk),
            reasoning: finalReasoning,
            suggested_text: p.suggestedRewrite,
            original_text: p.originalText,
            status: 'open'
        };
    });
};

const normalizeRisk = (riskStr: string): RiskLevel => {
    const r = riskStr.toLowerCase();
    if (r.includes('red') || r.includes('high') || r.includes('critical')) return RiskLevel.RED;
    if (r.includes('green') || r.includes('low')) return RiskLevel.GREEN;
    return RiskLevel.YELLOW;
};
