"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { WordCard, WordSuggestion } from "@/components/dictionary/WordCard";
import { SuggestWordModal } from "@/components/dictionary/SuggestWordModal";

export default function DictionaryPage() {
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const fetchDictionary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      
      if (category) params.append("category", category);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetch(`/api/dictionary?${params.toString()}`);
      if (!res.ok) throw new Error("Impossible de charger le dictionnaire");
      
      const data = await res.json();
      setSuggestions(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedSearch]);

  useEffect(() => {
    fetchDictionary();
  }, [fetchDictionary]);

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="text-[#D90097]" size={24} />
            <h1 className="text-2xl md:text-3xl font-bold font-syne tracking-tight">
              Dictionnaire Communautaire
            </h1>
          </div>
          <p className="text-sm text-neutral-400 max-w-xl">
            Proposez, recherchez et votez pour le vocabulaire urbain, technique ou artistique utilisé dans les paroles.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#AB0063] to-[#D50093] hover:opacity-95 transition-opacity text-sm font-bold rounded-xl shadow-lg shadow-[#AB0063]/20 shrink-0"
        >
          <Plus size={18} />
          Suggérer un mot
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un mot, une expression, un synonyme..."
            className="w-full bg-neutral-900/50 backdrop-blur border border-neutral-800 focus:border-[#D90097] rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-neutral-600 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="bg-neutral-900/50 backdrop-blur border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
        >
          <option value="">Toutes les catégories</option>
          <option value="standard">Standard</option>
          <option value="argot">Argot / Jargon</option>
          <option value="genre_musical">Genre Musical</option>
          <option value="geographie">Origine Géo</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-400 mb-8 max-w-xl mx-auto">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-1">Erreur de chargement</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="text-[#D90097] animate-spin" size={36} />
          <span className="text-sm text-neutral-500 font-medium">Chargement du dictionnaire...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-900/10 backdrop-blur-sm">
          <BookOpen className="text-neutral-600 mx-auto mb-4" size={40} />
          <h3 className="font-semibold text-lg text-neutral-300">Aucun résultat</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
            Aucun terme ne correspond à vos critères de recherche. Soyez le premier à proposer ce mot !
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 transition-colors text-xs font-semibold rounded-xl text-neutral-200"
          >
            <Plus size={14} />
            Suggérer un mot
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((item) => (
              <WordCard
                key={item.id}
                wordData={item}
                onVoteSuccess={fetchDictionary}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-900 disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
              >
                Précédent
              </button>
              <span className="text-xs text-neutral-400 font-medium px-4">
                Page {page} sur {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-900 disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      <SuggestWordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDictionary}
      />
    </div>
  );
}