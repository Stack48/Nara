'use client';
import { useState, useCallback } from 'react';
import type { LinguisticResult, RhymeResult } from '@/lib/linguistic.types';

type Panel = 'synonyms' | 'antonyms' | 'lexical' | 'rhymes';

export function useLinguistic(panel: Panel) {
  const [data, setData] = useState<LinguisticResult | RhymeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (word: string) => {
    if (!word.trim()) return;

    setLoading(true);
    setError(null);

    const endpoint = panel === 'lexical' ? 'lexical-field' : panel;

    try {
      const res = await fetch(`/api/linguistic/${endpoint}?word=${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [panel]);

  return { data, loading, error, search };
}
