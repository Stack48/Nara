"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  FlaskConical,
  Loader2,
  ShieldAlert,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";

interface CrawlLogEntry {
  id: string;
  source: string;
  status: string;
  inserted: number;
  skipped: number;
  failed: number;
  message: string | null;
  startedAt: string;
  endedAt: string | null;
}

interface DictionaryEntryRow {
  id: string;
  word: string;
  definition: string | null;
  language: string;
  category: string | null;
  source: string;
  status: string;
  createdAt: string;
}

interface CrawlDashboard {
  logs: CrawlLogEntry[];
  totalEntries: number;
  bySource: { source: string; count: number }[];
  recentEntries: DictionaryEntryRow[];
}

interface CrawlRunResult {
  inserted: number;
  skipped: number;
  failed: number;
  seedsProcessed: number;
  dryRun: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  datamuse: "bg-sky-500/15 text-sky-400",
  free_dictionary: "bg-emerald-500/15 text-emerald-400",
  wiktionary: "bg-amber-500/15 text-amber-400",
};

const STATUS_BADGES: Record<string, { className: string; icon: typeof CheckCircle2 }> = {
  success: { className: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2 },
  partial: { className: "bg-amber-500/15 text-amber-400", icon: AlertTriangle },
  failed: { className: "bg-red-500/15 text-red-400", icon: XCircle },
  running: { className: "bg-sky-500/15 text-sky-400", icon: Clock },
};

async function getCognitoId(): Promise<string> {
  let cognitoId = "";
  try {
    const session = await fetchAuthSession();
    cognitoId = session.userSub || session.tokens?.idToken?.payload?.sub?.toString() || "";
  } catch {
    cognitoId = "";
  }

  if (!cognitoId && process.env.NODE_ENV === "development") {
    return "cognito-lea-001";
  }

  return cognitoId;
}

export default function AdminCrawlPage() {
  const [dashboard, setDashboard] = useState<CrawlDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<"dry" | "real" | null>(null);
  const [lastResult, setLastResult] = useState<CrawlRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const cognitoId = await getCognitoId();
      if (!cognitoId) {
        throw new Error("Vous devez être connecté en tant qu'administrateur");
      }

      const res = await fetch("/api/admin/dictionary/crawl", {
        headers: { "x-cognito-id": cognitoId },
      });

      if (!res.ok) {
        if (res.status === 403) {
          setIsAdmin(false);
          return;
        }
        throw new Error("Impossible de charger le tableau de bord");
      }

      setDashboard(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const runCrawl = async (dryRun: boolean) => {
    setRunning(dryRun ? "dry" : "real");
    setLastResult(null);
    setError(null);
    try {
      const cognitoId = await getCognitoId();
      const res = await fetch(`/api/admin/dictionary/crawl?dryRun=${dryRun}`, {
        method: "POST",
        headers: { "x-cognito-id": cognitoId },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Le crawl a échoué");
      }

      const data = await res.json();
      setLastResult(data.result);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setRunning(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-neutral-400">
        <ShieldAlert size={40} className="text-red-400" />
        <p>Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
            <Database size={24} className="text-[#D90097]" />
            Crawling du dictionnaire
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Enrichissement automatique depuis Datamuse, Free Dictionary et Wiktionnaire.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => runCrawl(true)}
            disabled={running !== null}
            className="flex h-10 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 text-sm font-medium text-white/90 transition-all hover:border-neutral-700 hover:bg-neutral-900/85 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {running === "dry" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FlaskConical size={16} className="text-sky-400" />
            )}
            Dry-run
          </button>

          <button
            onClick={() => runCrawl(false)}
            disabled={running !== null}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#D90097] px-4 text-sm font-semibold text-white transition-all hover:bg-[#b8007f] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {running === "real" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            Lancer le crawl
          </button>

          <button
            onClick={loadDashboard}
            disabled={loading}
            title="Rafraîchir"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-400 transition-all hover:border-neutral-700 hover:text-white cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {lastResult && (
        <div
          className={`rounded-xl border px-5 py-4 ${
            lastResult.dryRun
              ? "border-sky-500/30 bg-sky-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          }`}
        >
          <p className="mb-2 text-sm font-semibold text-white">
            {lastResult.dryRun ? "Dry-run terminé — rien n'a été inséré" : "Crawl terminé"}
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-emerald-400">{lastResult.inserted} insérés</span>
            <span className="text-neutral-400">{lastResult.skipped} doublons ignorés</span>
            <span className={lastResult.failed > 0 ? "text-red-400" : "text-neutral-500"}>
              {lastResult.failed} échecs
            </span>
            <span className="text-neutral-400">{lastResult.seedsProcessed} seeds traités</span>
          </div>
        </div>
      )}

      {/* Stats par source */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Total entrées</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {loading ? "…" : dashboard?.totalEntries ?? 0}
          </p>
        </div>
        {dashboard?.bySource.map((s) => (
          <div key={s.source} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{s.source}</p>
            <p className="mt-1 text-2xl font-bold text-white">{s.count}</p>
          </div>
        ))}
      </section>

      {/* Historique des crawls */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Historique des sessions</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Insérés</th>
                <th className="px-4 py-3 text-right">Ignorés</th>
                <th className="px-4 py-3 text-right">Échecs</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70">
              {dashboard?.logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                    Aucune session de crawl pour le moment. Lance un dry-run pour tester.
                  </td>
                </tr>
              )}
              {dashboard?.logs.map((log) => {
                const badge = STATUS_BADGES[log.status] ?? STATUS_BADGES.running;
                const Icon = badge.icon;
                return (
                  <tr key={log.id} className="bg-neutral-950/40 transition-colors hover:bg-neutral-900/40">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-300">
                      {new Date(log.startedAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                      >
                        <Icon size={12} />
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400">{log.inserted}</td>
                    <td className="px-4 py-3 text-right text-neutral-400">{log.skipped}</td>
                    <td className={`px-4 py-3 text-right ${log.failed > 0 ? "text-red-400" : "text-neutral-600"}`}>
                      {log.failed}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-neutral-500">{log.message ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dernières entrées crawlées */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Dernières entrées crawlées</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dashboard?.recentEntries.length === 0 && !loading && (
            <p className="col-span-full py-6 text-center text-neutral-500">
              Aucune entrée. Lance un crawl pour remplir le dictionnaire.
            </p>
          )}
          {dashboard?.recentEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-white">{entry.word}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                    SOURCE_COLORS[entry.source] ?? "bg-neutral-500/15 text-neutral-400"
                  }`}
                >
                  {entry.source}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs text-neutral-400">
                {entry.definition || <span className="italic text-neutral-600">Pas de définition ({entry.category})</span>}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-neutral-600">
                <span>{entry.language}</span>
                <span>·</span>
                <span>{entry.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
