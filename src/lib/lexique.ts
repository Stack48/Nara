import 'server-only';
import fs from 'fs';
import path from 'path';
import type { RhymeResult } from './linguistic.types';

interface LexiqueEntry {
  word: string;
  phoneme: string;       // phonetic transcription (phon column)
  syllables: number;     // number of syllables (nbsyll column)
  category: string;      // grammatical category (cgram column)
}

// Singleton Map — loaded once in memory
let lexiqueIndex: Map<string, LexiqueEntry> | null = null;

function loadLexique(): Map<string, LexiqueEntry> {
  if (lexiqueIndex) return lexiqueIndex;

  const filePath = path.join(process.cwd(), 'src/data/lexique.tsv');
  
  if (!fs.existsSync(filePath)) {
    console.warn(`[Lexique] TSV dataset not found at ${filePath}. Returning empty index.`);
    lexiqueIndex = new Map();
    return lexiqueIndex;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  if (lines.length === 0) {
    lexiqueIndex = new Map();
    return lexiqueIndex;
  }

  // Parse headers dynamically for extra robustness
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
  const orthoIdx = headers.indexOf('ortho');
  const phonIdx = headers.indexOf('phon');
  const cgramIdx = headers.indexOf('cgram');
  const nbsyllIdx = headers.indexOf('nbsyll');

  // Fallback to standard indices (0=ortho, 7=phon, 4=cgram, 3=nbsyll) if headers are not found
  const oIdx = orthoIdx !== -1 ? orthoIdx : 0;
  const pIdx = phonIdx !== -1 ? phonIdx : 7;
  const cIdx = cgramIdx !== -1 ? cgramIdx : 4;
  const nIdx = nbsyllIdx !== -1 ? nbsyllIdx : 3;

  lexiqueIndex = new Map();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split('\t');
    if (cols.length <= Math.max(oIdx, pIdx, cIdx, nIdx)) continue;

    const word = cols[oIdx].trim().toLowerCase();
    if (!word) continue;

    const entry: LexiqueEntry = {
      word,
      category: cols[cIdx].trim(),
      syllables: parseInt(cols[nIdx].trim()) || 0,
      phoneme: cols[pIdx].trim(),
    };

    // If there are duplicate words, the first one or latest one will be mapped.
    // Map.set updates it, which is fine for general uses.
    lexiqueIndex.set(word, entry);
  }

  return lexiqueIndex;
}

export function getWordInfo(word: string): LexiqueEntry | null {
  const index = loadLexique();
  return index.get(word.toLowerCase()) ?? null;
}

export function getRhymes(word: string, limit = 8): RhymeResult {
  const index = loadLexique();
  const entry = index.get(word.toLowerCase());

  if (!entry || !entry.phoneme) {
    return { word, results: [], syllables: entry?.syllables ?? 0, category: entry?.category ?? '' };
  }

  // Rhyme = same phonemic suffix (last 3 phonemes, or full phoneme if shorter)
  const phoneme = entry.phoneme;
  const rhymeSuffix = phoneme.slice(-3);

  const rhymes: string[] = [];
  for (const [w, e] of index) {
    if (w === word.toLowerCase()) continue;
    if (e.phoneme && e.phoneme.endsWith(rhymeSuffix)) {
      rhymes.push(w);
      if (rhymes.length >= limit) break;
    }
  }

  return {
    word,
    results: rhymes,
    syllables: entry.syllables,
    category: entry.category,
  };
}
