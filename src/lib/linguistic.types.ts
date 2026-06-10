export interface LinguisticResult {
  word: string;
  results: string[];
  error?: string;
  availableSyllables?: number[];
  availableCategories?: string[];
}

export interface RhymeResult extends LinguisticResult {
  syllables?: number;
  category?: string;
  availableSyllables?: number[];
  availableCategories?: string[];
}
