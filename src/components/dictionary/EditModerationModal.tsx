"use client";

import { useState, useEffect, useRef } from "react";
import { X, Edit, AlertCircle, ChevronDown, Check } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { WordSuggestion } from "./WordCard";

type CustomSelectOption = {
  label: string;
  value: string;
};

function CustomSelect({
  options,
  value,
  onChange,
}: {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(event: Event) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-sm font-medium text-white outline-none transition-all hover:bg-neutral-850 hover:border-neutral-700 focus:border-[#D90097] cursor-pointer"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 left-0 top-[calc(100%+6px)] z-[120] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 py-1 shadow-2xl backdrop-blur-md"
          style={{ maxHeight: "200px" }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#D90097]/15 text-[#D90097] font-semibold"
                    : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0 text-[#D90097]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface EditModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordData: WordSuggestion | null;
  onSuccess: () => void;
}

export const EditModerationModal = ({
  isOpen,
  onClose,
  wordData,
  onSuccess,
}: EditModerationModalProps) => {
  const [word, setWord] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"standard" | "argot" | "genre_musical" | "geographie">("standard");
  const [language, setLanguage] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [antonyms, setAntonyms] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wordData) {
      setWord(wordData.word || "");
      setDescription(wordData.description || "");
      setCategory((wordData.category as any) || "standard");
      setLanguage(wordData.language || "fr");
      setSynonyms(wordData.synonyms || "");
      setAntonyms(wordData.antonyms || "");
    }
  }, [wordData]);

  if (!isOpen || !wordData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!description.trim()) throw new Error("La définition est requise");

      let cognitoId = "";
      try {
        const session = await fetchAuthSession();
        cognitoId = session.userSub || session.tokens?.idToken?.payload?.sub || "";
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          cognitoId = "cognito-lea-001";
        }
      }

      if (!cognitoId && process.env.NODE_ENV === "development") {
        cognitoId = "cognito-lea-001";
      }

      if (!cognitoId) {
        throw new Error("Vous devez être connecté en tant qu'administrateur");
      }

      const res = await fetch(`/api/admin/dictionary/${wordData.id}`, {
        method: "PUT",
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
        throw new Error(data.error || "Une erreur est survenue lors de la modification");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification");
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
            <Edit size={22} />
          </div>
          <div>
            <h3 className="font-syne font-bold text-white text-lg leading-tight">
              Modérer la suggestion
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Modifiez et ajustez les détails du mot avant de le valider
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
                Mot ou Expression
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
                Catégorie
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val)}
                options={[
                  { label: "Standard", value: "standard" },
                  { label: "Argot / Jargon", value: "argot" },
                  { label: "Genre Musical", value: "genre_musical" },
                  { label: "Origine Géo", value: "geographie" },
                ]}
              />
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
              required
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D90097] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors resize-none"
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
              {loading ? "Modification..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};