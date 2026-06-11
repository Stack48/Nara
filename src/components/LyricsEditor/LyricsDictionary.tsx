"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  HelpCircle,
  Plus,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";

interface WordSuggestion {
  id: string;
  word: string;
  description: string;
  synonyms: string | null;
  antonyms: string | null;
  isVerifiedByNara: boolean;
  status: string;
  createdAt: string;
  category: string | null;
  language: string | null;
  voteSum: number;
  author?: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
  votes?: Array<{ value: number; userId: string }>;
}

interface LyricsDictionaryProps {
  onClose: () => void;
  searchTermFromProps?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Standard",
  argot: "Argot / Jargon",
  genre_musical: "Genre Musical",
  geographie: "Origine Géo",
};

export default function LyricsDictionary({
  onClose,
  searchTermFromProps,
}: LyricsDictionaryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (searchTermFromProps !== undefined) {
      setSearchTerm(searchTermFromProps);
    }
  }, [searchTermFromProps]);
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<WordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggest word view state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [form, setForm] = useState({
    word: "",
    definition: "",
    category: "standard",
    language: "fr",
    synonyms: "",
    antonyms: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch dictionary items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("limit", "50");
      params.append("status", "APPROVED"); // Default to approved words
      if (category) params.append("category", category);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/dictionary?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [category, searchTerm]);

  useEffect(() => {
    // Debounce search in editor
    const delayDebounce = setTimeout(() => {
      fetchItems();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, category, fetchItems]);

  const handleVote = async (id: string, value: 1 | -1) => {
    try {
      let cognitoId = "";
      try {
        const session = await fetchAuthSession();
        cognitoId = session.userSub || session.tokens?.idToken?.payload?.sub || "";
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          cognitoId = "cognito-marcus-001";
        }
      }

      if (!cognitoId && process.env.NODE_ENV === "development") {
        cognitoId = "cognito-marcus-001";
      }

      const res = await fetch(`/api/dictionary/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cognito-id": cognitoId || "",
        },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) throw new Error("Vote failed");
      const updatedWord = await res.json();
      
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, voteSum: updatedWord.voteSum } : item))
      );
    } catch (err) {
      console.error("Voting error", err);
    }
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (!form.word.trim()) throw new Error("Le mot est requis");
      if (!form.definition.trim()) throw new Error("La définition est requise");

      let cognitoId = "";
      try {
        const session = await fetchAuthSession();
        cognitoId = session.userSub || session.tokens?.idToken?.payload?.sub || "";
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          cognitoId = "cognito-marcus-001";
        }
      }

      if (!cognitoId && process.env.NODE_ENV === "development") {
        cognitoId = "cognito-marcus-001";
      }

      if (!cognitoId) {
        throw new Error("Vous devez être connecté");
      }

      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cognito-id": cognitoId,
        },
        body: JSON.stringify({
          word: form.word.trim(),
          description: form.definition.trim(),
          category: form.category,
          language: form.language,
          synonyms: form.synonyms.trim() || null,
          antonyms: form.antonyms.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      setForm({
        word: "",
        definition: "",
        category: "standard",
        language: "fr",
        synonyms: "",
        antonyms: "",
      });

      setIsSuggesting(false);
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || "Erreur de soumission");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <section className="min-w-0 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2 hover:bg-white/[0.035] hover:border-white/[0.08] transition-all duration-300 flex flex-col gap-2 mx-2.5 my-1 text-white">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/[0.04] mb-1">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-white/60" />
          <h3 className="text-[11px] font-bold tracking-wide uppercase text-white/40">
            {isSuggesting ? "Suggérer un mot" : "Dictionnaire"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>

      {isSuggesting ? (
        /* Suggestion Form View */
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsSuggesting(false)}
            className="flex items-center gap-1.5 text-[10px] text-neutral-400 hover:text-white transition-colors mb-2 self-start"
          >
            <ArrowLeft size={12} />
            Retour à la recherche
          </button>

          {formError && (
            <div className="flex gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-450 mb-2">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSuggestSubmit} className="space-y-2.5">
            <div>
              <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1 block">
                Mot <span className="text-[#DA069A]">*</span>
              </label>
              <input
                type="text"
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
                required
                placeholder="Ex: Moula, Flow..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1 block">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-[#1c1c21] border border-white/[0.08] rounded-xl px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#DA069A]/50 transition-all"
                >
                  <option value="standard">Standard</option>
                  <option value="argot">Argot</option>
                  <option value="genre_musical">Musique</option>
                  <option value="geographie">Origine Géo</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1 block">
                  Langue
                </label>
                <input
                  type="text"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  placeholder="fr"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1 block">
                Définition <span className="text-[#DA069A]">*</span>
              </label>
              <textarea
                value={form.definition}
                onChange={(e) => setForm({ ...form, definition: e.target.value })}
                required
                placeholder="Signification du mot..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1 block">
                  Synonymes
                </label>
                <input
                  type="text"
                  value={form.synonyms}
                  onChange={(e) => setForm({ ...form, synonyms: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-1 block">
                  Antonymes
                </label>
                <input
                  type="text"
                  value={form.antonyms}
                  onChange={(e) => setForm({ ...form, antonyms: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading || !form.word.trim() || !form.definition.trim()}
              className="w-full rounded-xl bg-[#DA069A] border border-[#DA069A]/50 py-2 text-[11px] font-semibold text-white hover:bg-[#E60091] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1.5"
            >
              {formLoading ? "Envoi..." : "Soumettre"}
            </button>
          </form>
        </div>
      ) : (
        /* Search View */
        <div className="flex flex-col gap-2">
          
          {/* Controls */}
          <div className="space-y-1.5 mb-1 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#DA069A]/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            <div className="flex gap-1.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 bg-[#1c1c21] border border-white/[0.08] rounded-xl px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#DA069A]/50 transition-all"
              >
                <option value="">Tous</option>
                <option value="standard">Standard</option>
                <option value="argot">Argot</option>
                <option value="genre_musical">Musique</option>
                <option value="geographie">Origine Géo</option>
              </select>

              <button
                onClick={() => setIsSuggesting(true)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-[#AB0063]/20 to-[#D50093]/20 hover:opacity-90 transition-opacity border border-[#DA069A]/20 text-[10px] font-semibold rounded-xl text-white flex items-center gap-1"
              >
                <Plus size={10} />
                Suggérer
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div
            className="max-h-[250px] overflow-y-auto pr-1 space-y-2 mt-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
            }}
          >
            {error && (
              <div className="flex gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-450">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading && items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                <Loader2 className="text-[#DA069A] animate-spin" size={16} />
                <span className="text-[9px] text-neutral-500">Chargement...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-[11px]">
                Aucun mot trouvé dans la base.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.10] transition-all"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-[11px]">{item.word}</span>
                      {item.isVerifiedByNara ? (
                        <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">
                          Vérifié
                        </span>
                      ) : (
                        <span className="text-[7px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded">
                          Auteur
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 bg-black/40 px-1 py-0.5 rounded text-[9px] text-neutral-400 shrink-0">
                      <button
                        onClick={() => handleVote(item.id, 1)}
                        className="hover:text-emerald-400 transition-colors p-0.5"
                      >
                        <ThumbsUp size={8} />
                      </button>
                      <span className="font-bold min-w-[8px] text-center">{item.voteSum}</span>
                      <button
                        onClick={() => handleVote(item.id, -1)}
                        className="hover:text-rose-400 transition-colors p-0.5"
                      >
                        <ThumbsDown size={8} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-300 leading-normal mb-1.5">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[8px] text-neutral-500 border-t border-white/[0.04] pt-1">
                    <span>{CATEGORY_LABELS[item.category || "standard"]}</span>
                    <span className="uppercase">{item.language || "fr"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}