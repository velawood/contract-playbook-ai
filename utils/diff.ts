
// Augment window to recognize the global library loaded via CDN
declare global {
    interface Window {
        diff_match_patch: any;
    }
}

// Ensure the library is initialized and patched
const initDiffMatchPatch = () => {
    if (typeof window === 'undefined' || !window.diff_match_patch) {
        throw new Error("diff_match_patch library not found. Ensure it is loaded in index.html");
    }

    const dmp = window.diff_match_patch;

    // Extend prototype if not already done
    if (!dmp.prototype.diff_wordMode) {
        
        // Helper: Convert words to characters for the diff algorithm
        dmp.prototype.diff_wordsToChars_ = function(text1: string, text2: string) {
            const lineArray: string[] = [];
            const lineHash: Record<string, number> = {};
            lineArray[0] = '';

            function diff_linesToCharsMunge_(text: string) {
                let chars = '';
                // UNIFIED DMP REGEX - DO NOT MODIFY THIS PATTERN
                // This MUST match what DMP expects for token boundaries
                const re = /(\w+|[^\w\s]+|\s+)/g;
                let match;
                
                while ((match = re.exec(text)) !== null) {
                    const token = match[0];
                    if (Object.prototype.hasOwnProperty.call(lineHash, token)) {
                        chars += String.fromCharCode(lineHash[token]);
                    } else {
                        lineArray.push(token);
                        lineHash[token] = lineArray.length - 1;
                        chars += String.fromCharCode(lineArray.length - 1);
                    }
                }
                return chars;
            }

            const chars1 = diff_linesToCharsMunge_(text1);
            const chars2 = diff_linesToCharsMunge_(text2);
            return { chars1, chars2, lineArray };
        };

        // Main word-mode diff function
        dmp.prototype.diff_wordMode = function(text1: string, text2: string) {
            const a = this.diff_wordsToChars_(text1, text2);
            const diffs = this.diff_main(a.chars1, a.chars2, false);
            this.diff_charsToLines_(diffs, a.lineArray);
            return diffs;
        };
    }

    return new dmp();
};

export interface DiffOp {
    op: number; // 0: equal, 1: insert, -1: delete
    text: string;
}

export const calculateWordDiff = (original: string, modified: string): DiffOp[] => {
    try {
        const dmp = initDiffMatchPatch();
        const diffs = dmp.diff_wordMode(original, modified);
        
        // Cleanup semantically for human readability
        dmp.diff_cleanupSemantic(diffs);

        return diffs.map((d: [number, string]) => ({
            op: d[0],
            text: d[1]
        }));
    } catch (e) {
        console.error("Diff calculation failed", e);
        // Fallback: Delete all, Insert all
        return [
            { op: -1, text: original },
            { op: 1, text: modified }
        ];
    }
};

export const DIFF_DELETE = -1;
export const DIFF_INSERT = 1;
export const DIFF_EQUAL = 0;
