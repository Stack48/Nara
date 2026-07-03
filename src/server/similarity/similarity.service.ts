// --- Réglages ---
const NGRAM_SIZE = 3;              // trigrammes de mots
const PREFILTER_THRESHOLD = 0.05;  // 5% de n-grammes communs → référence candidate
const PASSAGE_THRESHOLD = 0.8;     // ratio Levenshtein min pour retenir un passage
const WINDOW_SIZE = 12;            // fenêtre de mots pour la comparaison fine
const ZONE_GAP_TOLERANCE = 2;      // mots d'écart tolérés entre deux zones chaudes

// --- Normalisation ---
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // accents
        .replace(/[^a-z0-9\s]/g, " ")    // ponctuation
        .replace(/\s+/g, " ")
        .trim();
}

// --- N-grammes de mots ---
export function getWordNGrams(text: string, n = NGRAM_SIZE): string[] {
    const words = text.split(" ").filter(Boolean);
    if (words.length < n) return words.length ? [words.join(" ")] : [];
    const ngrams: string[] = [];
    for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(" "));
    }
    return ngrams;
}

// --- Levenshtein (2 lignes glissantes → O(min) en mémoire) ---
export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let curr = new Array<number>(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[b.length];
}

// Ratio de similarité 0..1 basé sur Levenshtein
export function similarityRatio(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshtein(a, b) / maxLen;
}

// --- Types de résultat (stockés dans AnalysisJob.matches) ---
export interface SimilarPassage {
    inputExcerpt: string;      // le passage dans le texte analysé
    referenceExcerpt: string;  // le passage correspondant dans la référence
    similarity: number;        // 0..100
    inputWordStart: number;    // position (en mots) dans le texte analysé
    inputWordEnd: number;
}

export interface ReferenceMatch {
    referenceId: string;
    title: string;
    artist: string | null;
    passages: SimilarPassage[];
}

export interface SimilarityResult {
    score: number;             // score global 0..100
    matches: ReferenceMatch[];
}

export interface ReferenceInput {
    id: string;
    title: string;
    artist: string | null;
    normalizedText: string;
    ngramHashes: string[];
}

// --- Analyse principale ---
export function analyzeSimilarity(
    rawText: string,
    references: ReferenceInput[]
): SimilarityResult {
    const inputText = normalizeText(rawText);
    const inputWords = inputText.split(" ").filter(Boolean);
    const inputNGramSet = new Set(getWordNGrams(inputText));

    if (inputNGramSet.size === 0) return { score: 0, matches: [] };

    const matches: ReferenceMatch[] = [];

    for (const ref of references) {
        // --- Phase 1 : pré-filtrage ---
        const refNGramSet = new Set(ref.ngramHashes);
        let common = 0;
        for (const gram of inputNGramSet) {
            if (refNGramSet.has(gram)) common++;
        }
        if (common / inputNGramSet.size < PREFILTER_THRESHOLD) continue;

        // --- Phase 2 : localisation des passages ---
        const refWords = ref.normalizedText.split(" ").filter(Boolean);
        const passages = findSimilarPassages(inputWords, refWords, refNGramSet);
        if (passages.length === 0) continue;

        matches.push({
            referenceId: ref.id,
            title: ref.title,
            artist: ref.artist,
            passages,
        });
    }

    // Tri : la référence la plus problématique en premier
    matches.sort(
        (a, b) =>
            Math.max(...b.passages.map((p) => p.similarity)) -
            Math.max(...a.passages.map((p) => p.similarity))
    );

    // Score global = % de mots de l'input couverts par au moins un passage
    const covered = new Set<number>();
    for (const m of matches) {
        for (const p of m.passages) {
            for (let i = p.inputWordStart; i < p.inputWordEnd; i++) covered.add(i);
        }
    }
    const score = inputWords.length
        ? Math.round((covered.size / inputWords.length) * 1000) / 10
        : 0;

    return { score, matches };
}

// Repère les zones de n-grammes communs, puis affine avec Levenshtein
function findSimilarPassages(
    inputWords: string[],
    refWords: string[],
    refNGramSet: Set<string>
): SimilarPassage[] {
    // 1. Marque les mots de l'input dont le trigramme existe dans la référence
    const hot: boolean[] = new Array(inputWords.length).fill(false);
    for (let i = 0; i <= inputWords.length - NGRAM_SIZE; i++) {
        const gram = inputWords.slice(i, i + NGRAM_SIZE).join(" ");
        if (refNGramSet.has(gram)) {
            for (let k = i; k < i + NGRAM_SIZE; k++) hot[k] = true;
        }
    }

    // 2. Regroupe les zones chaudes contiguës (tolérance de petits trous)
    const zones: Array<{ start: number; end: number }> = [];
    let start = -1;
    let gap = 0;
    for (let i = 0; i < hot.length; i++) {
        if (hot[i]) {
            if (start === -1) start = i;
            gap = 0;
        } else if (start !== -1 && ++gap > ZONE_GAP_TOLERANCE) {
            zones.push({ start, end: i - gap + 1 });
            start = -1;
        }
    }
    if (start !== -1) zones.push({ start, end: hot.length });

    // 3. Pour chaque zone, cherche le meilleur alignement dans la référence
    const passages: SimilarPassage[] = [];

    for (const zone of zones) {
        const excerptWords = inputWords.slice(zone.start, zone.end);
        if (excerptWords.length < NGRAM_SIZE) continue;
        const excerpt = excerptWords.join(" ");

        const best = findBestWindow(
            excerpt,
            refWords,
            Math.max(excerptWords.length, WINDOW_SIZE)
        );

        if (best && best.similarity >= PASSAGE_THRESHOLD) {
            passages.push({
                inputExcerpt: excerpt,
                referenceExcerpt: best.window,
                similarity: Math.round(best.similarity * 1000) / 10, // → 0..100
                inputWordStart: zone.start,
                inputWordEnd: zone.end,
            });
        }
    }

    return passages;
}

// Fenêtre glissante sur la référence (pas de 3 mots pour limiter le coût)
function findBestWindow(
    excerpt: string,
    refWords: string[],
    windowSize: number
): { window: string; similarity: number } | null {
    let best: { window: string; similarity: number } | null = null;
    const step = 3;

    for (let i = 0; i < refWords.length; i += step) {
        const window = refWords.slice(i, i + windowSize).join(" ");
        if (!window) break;
        const sim = similarityRatio(excerpt, window);
        if (!best || sim > best.similarity) best = { window, similarity: sim };
        if (best.similarity > 0.98) break; // early exit si quasi-identique
    }
    return best;
}