"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Edit2, ShieldAlert, BarChart3, HelpCircle, Loader2, AlertTriangle, Undo2, Search, ChevronDown } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { WordSuggestion } from "@/components/dictionary/WordCard";
import { EditModerationModal } from "@/components/dictionary/EditModerationModal";

interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  categoryDistribution: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Standard",
  argot: "Argot / Jargon",
  genre_musical: "Genre Musical",
  geographie: "Origine Géo",
};

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
  onChange: (value: string) => void;
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
    <div ref={containerRef} className="relative inline-flex items-center min-w-[180px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur px-4 text-sm font-medium text-white/90 outline-none transition-all hover:bg-neutral-900/85 hover:border-neutral-700 focus:border-[#D90097] cursor-pointer"
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
          className="absolute right-0 top-[calc(100%+6px)] z-[100] w-full overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 py-1 shadow-2xl backdrop-blur-md"
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

export default function AdminDictionaryPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [queue, setQueue] = useState<WordSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);

  const [editingWord, setEditingWord] = useState<WordSuggestion | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchStatsAndQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
        setIsAdmin(false);
        throw new Error("Vous devez être connecté en tant qu'administrateur");
      }

      const statsRes = await fetch("/api/admin/dictionary/stats", {
        headers: { "x-cognito-id": cognitoId },
      });
      
      if (!statsRes.ok) {
        if (statsRes.status === 403) {
          setIsAdmin(false);
        }
        throw new Error("Accès refusé ou erreur serveur stats.");
      }
      
      const statsData = await statsRes.json();
      setStats(statsData);
      setIsAdmin(true);

      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      params.append("status", statusFilter);
      if (category) params.append("category", category);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (sortBy) params.append("sortBy", sortBy);

      const queueRes = await fetch(`/api/admin/dictionary?${params.toString()}`, {
        headers: { "x-cognito-id": cognitoId },
      });
      if (!queueRes.ok) throw new Error("Impossible de charger la file de modération");
      
      const queueData = await queueRes.json();
      setQueue(queueData.items || []);
      setTotalPages(queueData.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }, [page, category, statusFilter, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchStatsAndQueue();
  }, [fetchStatsAndQueue]);

  const handleModerate = async (id: string, status: "PENDING" | "APPROVED" | "REJECTED") => {
    try {
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

      const res = await fetch(`/api/admin/dictionary/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-cognito-id": cognitoId || "",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue");
      }

      fetchStatsAndQueue();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la modération");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="text-rose-500 mb-4" size={50} />
        <h1 className="text-xl font-bold font-syne mb-2">Accès Refusé</h1>
        <p className="text-sm text-neutral-400 max-w-sm">
          Vous devez disposer d'un compte administrateur (Léa) pour accéder à l'interface de modération du dictionnaire.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 md:p-10">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="text-amber-500" size={26} />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-syne tracking-tight">
            Modération du Dictionnaire
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Gérez et vérifiez les propositions faites par les auteurs et la communauté Nara.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-md">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Total Soumis
            </span>
            <span className="text-3xl font-bold font-syne">{stats.total}</span>
          </div>
          <button
            onClick={() => {
              setStatusFilter("PENDING");
              setPage(1);
            }}
            className={`text-left rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 ${
              statusFilter === "PENDING"
                ? "border-amber-500/80 bg-amber-500/5 ring-1 ring-amber-500/20 shadow-lg"
                : "bg-neutral-900/40 border-neutral-800/80 hover:border-amber-500/30 hover:bg-neutral-900/50"
            }`}
          >
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-1">
              En Attente
            </span>
            <span className="text-3xl font-bold font-syne text-amber-500">{stats.pending}</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter("APPROVED");
              setPage(1);
            }}
            className={`text-left rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 ${
              statusFilter === "APPROVED"
                ? "border-emerald-500/80 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-lg"
                : "bg-neutral-900/40 border-neutral-800/80 hover:border-emerald-500/30 hover:bg-neutral-900/50"
            }`}
          >
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block mb-1">
              Validés / Vérifiés
            </span>
            <span className="text-3xl font-bold font-syne text-emerald-500">{stats.approved}</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter("REJECTED");
              setPage(1);
            }}
            className={`text-left rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 ${
              statusFilter === "REJECTED"
                ? "border-rose-500/80 bg-rose-500/5 ring-1 ring-rose-500/20 shadow-lg"
                : "bg-neutral-900/40 border-neutral-800/80 hover:border-rose-500/30 hover:bg-neutral-900/50"
            }`}
          >
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block mb-1">
              Rejetés
            </span>
            <span className="text-3xl font-bold font-syne text-rose-500">{stats.rejected}</span>
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold font-syne flex items-center gap-2">
          <BarChart3 size={18} className="text-[#D90097]" />
          {statusFilter === "PENDING" && `Suggestions en attente (${queue.length})`}
          {statusFilter === "APPROVED" && `Suggestions validées (${queue.length})`}
          {statusFilter === "REJECTED" && `Suggestions rejetées (${queue.length})`}
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="bg-neutral-900/50 backdrop-blur border border-neutral-800 focus:border-[#D90097] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none transition-colors placeholder:text-neutral-600 w-full sm:w-64"
            />
          </div>

          <CustomSelect
            value={category}
            onChange={(val) => {
              setCategory(val);
              setPage(1);
            }}
            options={[
              { label: "Toutes les catégories", value: "" },
              { label: "Standard", value: "standard" },
              { label: "Argot / Jargon", value: "argot" },
              { label: "Genre Musical", value: "genre_musical" },
              { label: "Origine Géo", value: "geographie" },
            ]}
          />

          <CustomSelect
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setPage(1);
            }}
            options={[
              { label: "Plus récents", value: "date_desc" },
              { label: "Plus populaires", value: "votes_desc" },
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-450 mb-6 max-w-xl mx-auto">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="text-[#D90097] animate-spin" size={36} />
          <span className="text-sm text-neutral-500 font-medium">Chargement de la file d'attente...</span>
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-900/10 backdrop-blur-sm">
          <Check className="text-emerald-500 mx-auto mb-4" size={40} />
          <h3 className="font-semibold text-lg text-neutral-300">File vide !</h3>
          <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
            {statusFilter === "PENDING" && "Aucun mot n'est en attente de modération pour le moment."}
            {statusFilter === "APPROVED" && "Aucun mot n'a été validé pour le moment."}
            {statusFilter === "REJECTED" && "Aucun mot n'a été rejeté pour le moment."}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Mot</th>
                  <th className="px-6 py-4 text-center">Votes</th>
                  <th className="px-6 py-4">Catégorie / Langue</th>
                  <th className="px-6 py-4">Définition & Exemples</th>
                  <th className="px-6 py-4">Proposé par</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {item.word}
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        item.voteSum > 0
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          : item.voteSum < 0
                          ? "text-rose-450 bg-rose-500/10 border border-rose-500/20"
                          : "text-neutral-400 bg-neutral-800/40 border border-neutral-800/60"
                      }`}>
                        {item.voteSum}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-neutral-400">
                          {CATEGORY_LABELS[item.category || "standard"]}
                        </span>
                        {item.language && (
                          <span className="text-[10px] text-neutral-500 uppercase font-medium">
                            {item.language}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <p className="text-xs line-clamp-2 leading-relaxed text-neutral-350">
                        {item.description}
                      </p>
                      {(item.synonyms || item.antonyms) && (
                        <div className="flex gap-3 mt-1.5 text-[10px] text-neutral-500">
                          {item.synonyms && <span>Syn: {item.synonyms}</span>}
                          {item.antonyms && <span>Ant: {item.antonyms}</span>}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400">
                      <div>{item.author?.name || item.author?.username || "Anonyme"}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingWord(item);
                            setIsEditOpen(true);
                          }}
                          className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        {statusFilter !== "PENDING" && (
                          <button
                            onClick={() => handleModerate(item.id, "PENDING")}
                            className="p-2 hover:bg-amber-500/10 text-neutral-400 hover:text-amber-400 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                            title="Re-mettre en attente"
                          >
                            <Undo2 size={14} />
                          </button>
                        )}
                        {statusFilter !== "APPROVED" && (
                          <button
                            onClick={() => handleModerate(item.id, "APPROVED")}
                            className="p-2 hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                            title="Valider / Approuver"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {statusFilter !== "REJECTED" && (
                          <button
                            onClick={() => handleModerate(item.id, "REJECTED")}
                            className="p-2 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                            title="Rejeter"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/30 border-t border-neutral-850">
              <span className="text-xs text-neutral-500">
                Affichage de la page {page} sur {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <EditModerationModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingWord(null);
        }}
        wordData={editingWord}
        onSuccess={fetchStatsAndQueue}
      />
    </div>
  );
}