// ---------- Outils de base ----------

// Nettoie un texte : minuscules, sans accents, sans ponctuation, espaces condensés.
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")                 // sépare les lettres de leurs accents
    .replace(/[\u0300-\u036f]/g, "")  // supprime les accents
    .replace(/[^a-z0-9\s]/g, " ")     // ponctuation -> espace
    .replace(/\s+/g, " ")             // espaces multiples -> un seul
    .trim();
}

// Découpe un texte en liste de mots.
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized.length === 0 ? [] : normalized.split(" ");
}

// Distance de Levenshtein : nombre minimal de modifications (lettre) entre deux mots/chaînes.
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // suppression
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// Transforme une distance en ressemblance entre 0 (rien) et 1 (identique).
export function similarityRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
}

// ---------- Comparaison de deux textes ----------

export type MatchedPassage = {
  text: string;        // le passage suspect (dans les paroles analysées)
  similarity: number;  // 0 à 100 : ressemblance avec la référence
  startWord: number;   // position du 1er mot (pour situer le passage)
  endWord: number;     // position du dernier mot
};

export type ComparisonResult = {
  score: number;              // 0 à 100 : similarité globale
  passages: MatchedPassage[]; // les passages concernés
};

const NGRAM_SIZE = 3;

export function compareTexts(sourceText: string, referenceText: string): ComparisonResult {
  const srcWords = tokenize(sourceText);
  const refWords = tokenize(referenceText);

  // Textes trop courts pour des 3-grammes : on compare en entier avec Levenshtein.
  if (srcWords.length < NGRAM_SIZE || refWords.length < NGRAM_SIZE) {
    const score = Math.round(similarityRatio(srcWords.join(" "), refWords.join(" ")) * 100);
    return {
      score,
      passages: score > 0
        ? [{ text: srcWords.join(" "), similarity: score, startWord: 0, endWord: Math.max(0, srcWords.length - 1) }]
        : [],
    };
  }

  // 1) On indexe les n-grammes de la référence : gramme -> positions de départ.
  const refIndex = new Map<string, number[]>();
  for (let j = 0; j <= refWords.length - NGRAM_SIZE; j++) {
    const gram = refWords.slice(j, j + NGRAM_SIZE).join(" ");
    const positions = refIndex.get(gram);
    if (positions) positions.push(j);
    else refIndex.set(gram, [j]);
  }

  // 2) On repère quels mots de la source sont couverts par un n-gramme commun.
  const covered = new Array<boolean>(srcWords.length).fill(false);
  const refStartAt = new Array<number>(srcWords.length).fill(-1); // alignement dans la référence
  for (let i = 0; i <= srcWords.length - NGRAM_SIZE; i++) {
    const gram = srcWords.slice(i, i + NGRAM_SIZE).join(" ");
    const positions = refIndex.get(gram);
    if (positions) {
      for (let k = i; k < i + NGRAM_SIZE; k++) {
        covered[k] = true;
        if (refStartAt[k] === -1) refStartAt[k] = positions[0] + (k - i);
      }
    }
  }

  // 3) On regroupe les mots couverts consécutifs en passages.
  const passages: MatchedPassage[] = [];
  let start = -1;
  for (let i = 0; i <= srcWords.length; i++) {
    const isCovered = i < srcWords.length && covered[i];
    if (isCovered && start === -1) {
      start = i;
    } else if (!isCovered && start !== -1) {
      const end = i - 1;
      const srcPassage = srcWords.slice(start, end + 1).join(" ");
      const refStart = refStartAt[start] >= 0 ? refStartAt[start] : 0;
      const refPassage = refWords.slice(refStart, refStart + (end - start + 1)).join(" ");
      const similarity = Math.round(similarityRatio(srcPassage, refPassage) * 100);
      passages.push({ text: srcPassage, similarity, startWord: start, endWord: end });
      start = -1;
    }
  }

  // 4) Score global = proportion de mots de la source retrouvés dans la référence.
  const coveredCount = covered.filter(Boolean).length;
  const score = Math.round((coveredCount / srcWords.length) * 100);

  return { score, passages };
}