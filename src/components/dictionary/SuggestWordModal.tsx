"use client";

import { useState } from "react";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";

interface SuggestWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuggestWordModal = ({
  isOpen,
  onClose,
  onSuccess,
}: SuggestWordModalProps) => {
  const [word, setWord] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"standard" | "argot" | "genre_musical" | "geographie">("standard");
  const [language, setLanguage] = useState("fr");
  const [synonyms, setSynonyms] = useState("");
  const [antonyms, setAntonyms] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!word.trim()) throw new Error("Le mot est requis");
      if (!description.trim()) throw new Error("La description est requise");

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
        throw new Error("Vous devez être connecté pour suggérer un mot");
      }

      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cognito-id": cognitoId,
        },
        body: JSON.stringify({
          word: word.trim(),
          description: description.trim(),
          category,
          language: language.trim() || "fr",
          synonyms: synonyms.trim() || null,
          antonyms: antonyms.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la suggestion");
      }

      setWord("");
      setDescription("");
      setCategory("standard");
      setLanguage("fr");
      setSynonyms("");
      setAntonyms("");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-neutral-800/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 hover:bg-neutral-800/60 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#D90097]/10 flex items-center justify-center text-[#D90097]">
            <PlusCircle size={22} />
          </div>
          <div>
            <h3 className="font-syne font-bold text-white text-lg leading-tight">
              Suggérer un mot
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Ajoutez un nouveau terme au dictionnaire communautaire
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400 mb-5 animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
                Mot ou Expression <span className="text-[#D90097]">*</span>
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Ex: Moula, Flow, S'enjailler..."
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors"
              >
                <option value="standard">Standard</option>
                <option value="argot">Argot / Jargon</option>
                <option value="genre_musical">Genre Musical</option>
                <option value="geographie">Origine Géo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
                Langue
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Ex: fr, en, verlan..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
              Définition & Explication <span className="text-[#D90097]">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez la signification du terme, son usage habituel dans les paroles, etc."
              required
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
                Synonymes
              </label>
              <input
                type="text"
                value={synonyms}
                onChange={(e) => setSynonyms(e.target.value)}
                placeholder="Ex: argent, oseille..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
                Antonymes
              </label>
              <input
                type="text"
                value={antonyms}
                onChange={(e) => setAntonyms(e.target.value)}
                placeholder="Ex: pauvreté, dèche..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/60 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-800 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#AB0063] to-[#D50093] text-xs font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-lg shadow-[#AB0063]/20"
            >
              {loading ? "Soumission..." : "Soumettre la suggestion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};