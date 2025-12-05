import { PlaybookRule } from '../types';

/* EMBEDDING DISABLED
// Dot product of two vectors
const dotProduct = (a: number[], b: number[]) => {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
};

// Magnitude of vector
const magnitude = (v: number[]) => {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
};
*/

export const cosineSimilarity = (vecA?: number[], vecB?: number[]): number => {
    /* EMBEDDING DISABLED
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) return 0;
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) return 0;
    return dotProduct(vecA, vecB) / (magA * magB);
    */
   return 0;
};

/**
 * Step A: Keyword-based Pre-classification
 * Returns top 3 likely categories based on signal keywords and synonyms.
 */
export const detectLikelyCategories = (text: string, rules: PlaybookRule[]): string[] => {
    const lowerText = text.toLowerCase();
    const categoryScores: Record<string, number> = {};

    rules.forEach(rule => {
        // Fallback to "UNCATEGORIZED" or use rule.topic if category is missing
        const cat = rule.category || 'GENERAL';
        
        let score = 0;
        
        // Keywords (weight 2)
        rule.signal_keywords?.forEach(kw => {
            if (lowerText.includes(kw.toLowerCase())) score += 2;
        });
        
        // Synonyms (weight 3)
        rule.synonyms?.forEach(syn => {
             if (lowerText.includes(syn.toLowerCase())) score += 3;
        });

        if (score > 0) {
            categoryScores[cat] = (categoryScores[cat] || 0) + score;
        }
    });

    // Sort by score desc and take top 20 (Expanded window for larger chunks)
    return Object.entries(categoryScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([cat]) => cat);
};

/**
 * Step C: Embedding Similarity Ranking
 * Returns top K rules ranked by cosine similarity to the chunk embedding.
 * NEW: Optional minScore threshold to skip matches that are too weak.
 */
export const getTopMatchingRulesByEmbedding = (
    chunkEmbedding: number[] | undefined, 
    rules: PlaybookRule[], 
    k: number = 5,
    minScore: number = 0.0
): PlaybookRule[] => {
    /* EMBEDDING DISABLED
    // If no chunk embedding (API failure), return the input rules (fallback to just category filter)
    if (!chunkEmbedding) return rules.slice(0, k);

    const scored = rules.map(r => ({
        rule: r,
        // If rule has no embedding, assign -1 score so it drops to bottom
        score: r.embedding ? cosineSimilarity(chunkEmbedding, r.embedding) : -1
    }));

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);

    // Filter by threshold if provided
    const filtered = minScore > 0 ? scored.filter(s => s.score >= minScore) : scored;

    return filtered.slice(0, k).map(s => s.rule);
    */
   return rules.slice(0, k);
};