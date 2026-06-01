export interface LinguisticResult {
  word: string;
  results: string[];
  error?: string;
}

export interface RhymeResult extends LinguisticResult {
  syllables?: number;
  category?: string;
}
