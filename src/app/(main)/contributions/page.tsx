"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
    ShieldCheck, FileText, Download, Check, X, Clock,
    Feather, Lock, History, ChevronDown, Loader2, Pencil,
} from "lucide-react";
import { getCurrentUser } from "aws-amplify/auth";
import "@/lib/amplify";

/**
 * Coffre « Mes contributions » du ghostwriter — modèle à historique de versions.
 *
 * Le texte est modifiable à tout moment (document vivant). Chaque scellement crée
 * une VERSION immuable, horodatée, ajoutée à l'historique — on ne modifie jamais
 * une version, on en scelle une nouvelle. La suite des versions = preuve datée de
 * la paternité.
 *
 * Vérification d'INTÉGRITÉ : réelle, dans le navigateur (SHA-256 canonique, même
 * algorithme que le backend). La validité de l'horodatage est confirmée côté
 * serveur (/api/certificates/verify).
 */

// Palette sémantique des états de vérification (le reste utilise les tokens
// du design system : n-surface, n-text, n-border…).
const C = {
    blue: "#0C447C", blueBg: "#E6F1FB",
    teal: "#0F6E56", tealBg: "#E1F5EE",
    amber: "#7A4A08", amberBg: "#FAEEDA",
    red: "#9A2A2A", redBg: "#FCEBEB",
};

const ASSURANCE_LABELS: Record<string, string> = {
    compte_authentifie: "Compte authentifié",
    signature_qualifiee_eidas: "Signature qualifiée eIDAS",
};

// ---- Types (contrat « fil », identique au backend) ----
interface AuthorRef {
    user_id: string;
    display_name: string;
    email: string | null;
    identity_assurance: string;
}
interface Contribution {
    project_ref: string;
    title: string;
    role: string;
    body: string;
    version: number;
    created_at: string;
    author: AuthorRef;
}
interface Certificate {
    contribution: Contribution;
    content_hash_hex: string;
    timestamp: { tsr_b64: string; tsa_name: string; qualified: boolean; gen_time: string | null; hash_algorithm: string };
    confidentiality_notice: string;
    sealed_at_local: string;
}
interface VerifyResponse {
    ok: boolean;
    hashMatches: boolean;
    timestampValid: boolean;
    qualified: boolean;
    sealedDate: string | null;
    details: string;
}

// ---- Empreinte canonique côté navigateur (même algo que le serveur) ----
function canonicalize(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(canonicalize);
    if (v && typeof v === "object") {
        const o: Record<string, unknown> = {};
        for (const k of Object.keys(v as Record<string, unknown>).sort()) {
            o[k] = canonicalize((v as Record<string, unknown>)[k]);
        }
        return o;
    }
    return v;
}
async function contentHashHex(contribution: Contribution): Promise<string> {
    const canon = JSON.stringify(canonicalize(contribution));
    const bytes = new TextEncoder().encode(canon);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(d);
}

function download(filename: string, obj: unknown) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}
const slug = (s: string) => s.replace(/\s+/g, "-").toLowerCase();

const CONFIDENTIALITY =
    "Contenu sous engagement de confidentialité accepté à l'invitation. " +
    "Copie et export autorisés pour usage personnel et preuve d'auteur ; diffusion publique interdite.";

// ---- Appels API authentifiés (header x-cognito-id, cf. conventions Nara) ----
async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const user = await getCurrentUser();
    return { "x-cognito-id": user.userId, ...(extra ?? {}) };
}

async function apiList(): Promise<Certificate[]> {
    const res = await fetch("/api/contributions", { headers: await authHeaders() });
    if (!res.ok) throw new Error("Chargement du coffre impossible");
    const data = await res.json();
    return data.certificates as Certificate[];
}
async function apiSeal(projectRef: string, title: string, body: string): Promise<Certificate> {
    const res = await fetch("/api/contributions/seal", {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ projectRef, title, body }),
    });
    if (!res.ok) throw new Error("Scellement impossible");
    return (await res.json()) as Certificate;
}
async function apiVerify(cert: Certificate): Promise<VerifyResponse> {
    const res = await fetch("/api/certificates/verify", {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(cert),
    });
    if (!res.ok) throw new Error("Vérification impossible");
    return (await res.json()) as VerifyResponse;
}

// ---- UI ----
function ResultRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
    return (
        <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0" style={{ color: ok ? C.teal : C.red }}>
                {ok ? <Check size={15} /> : <X size={15} />}
            </span>
            <span className="text-xs text-n-text">
                <span className="font-medium">{label}</span>
                <span className="text-n-text-2"> — {detail}</span>
            </span>
        </div>
    );
}

type VerifyState =
    | { phase: "idle" }
    | { phase: "checking" }
    | { phase: "done"; integrity: boolean; timestampValid: boolean; qualified: boolean };

function VersionRow({ cert, isLatest }: { cert: Certificate; isLatest: boolean }) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<VerifyState>({ phase: "idle" });

    const verify = useCallback(async () => {
        setState({ phase: "checking" });
        const recomputed = await contentHashHex(cert.contribution);
        const integrity = recomputed === cert.content_hash_hex;
        const server = await apiVerify(cert);
        setState({ phase: "done", integrity, timestampValid: server.timestampValid, qualified: server.qualified });
    }, [cert]);

    const exportCert = useCallback(() => {
        download(`certificat-${slug(cert.contribution.project_ref)}-v${cert.contribution.version}.json`, cert);
    }, [cert]);

    const overallOk = state.phase === "done" && state.integrity && state.timestampValid;

    return (
        <div className="border-t border-n-border">
            <div className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-n-text">
                            Version {cert.contribution.version}
                        </span>
                        {isLatest && (
                            <span className="rounded px-1.5 py-0.5 text-xs font-medium"
                                style={{ background: C.tealBg, color: C.teal }}>actuelle</span>
                        )}
                    </div>
                    <div className="text-xs text-n-text-2">
                        scellé le {fmtDate(cert.timestamp.gen_time)} ·{" "}
                        <span className="font-mono">{cert.content_hash_hex.slice(0, 16)}…</span>
                    </div>
                </div>

                {state.phase === "done" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: overallOk ? C.teal : C.red }}>
                        {overallOk ? <Check size={14} /> : <X size={14} />}
                        {overallOk ? "intègre" : "altéré"}
                    </span>
                )}

                <button onClick={() => setOpen((o) => !o)}
                    className="inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus:ring-2"
                    style={{ color: C.blue }}>
                    Détail <ChevronDown size={13} className="transition"
                        style={{ transform: open ? "rotate(180deg)" : "none" }} />
                </button>
                <button onClick={verify} disabled={state.phase === "checking"}
                    className="inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
                    style={{ color: C.blue }}>
                    {state.phase === "checking"
                        ? <><Loader2 size={13} className="animate-spin" /> …</>
                        : <><ShieldCheck size={13} /> Vérifier</>}
                </button>
            </div>

            {open && (
                <div className="mb-3 rounded-md border border-n-border p-3">
                    <dl className="space-y-2 text-xs text-n-text-2">
                        <div>
                            <dt className="font-medium text-n-text">Empreinte SHA-256</dt>
                            <dd className="font-mono break-all">{cert.content_hash_hex}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="font-medium text-n-text">Autorité d&apos;horodatage</dt>
                            <dd className="text-right">{cert.timestamp.tsa_name}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="font-medium text-n-text">Date scellée</dt>
                            <dd>{fmtDate(cert.timestamp.gen_time)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="font-medium text-n-text">Auteur</dt>
                            <dd className="text-right">
                                {cert.contribution.author.display_name}
                                {" · "}
                                {ASSURANCE_LABELS[cert.contribution.author.identity_assurance] || cert.contribution.author.identity_assurance}
                            </dd>
                        </div>
                        <div>
                            <dt className="mb-1 font-medium text-n-text">Texte certifié</dt>
                            <dd className="whitespace-pre-wrap rounded p-2 font-mono"
                                style={{ background: C.blueBg, color: C.blue }}>{cert.contribution.body}</dd>
                        </div>
                    </dl>

                    {state.phase === "done" && (
                        <div className="mt-3 space-y-1.5 rounded-md p-2.5"
                            style={{ background: overallOk ? C.tealBg : C.redBg }}>
                            <ResultRow ok={state.integrity} label="Intégrité du texte"
                                detail={state.integrity
                                    ? "correspond à l'empreinte scellée"
                                    : "le texte ne correspond plus à l'empreinte"} />
                            <ResultRow ok={state.timestampValid} label="Horodatage"
                                detail={state.qualified
                                    ? "qualifié eIDAS — présomption de date et d'intégrité (art. 41)"
                                    : "non qualifié — valeur probante faible"} />
                        </div>
                    )}

                    <button onClick={exportCert}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-n-border px-2.5 py-1.5 text-xs font-medium text-n-text focus:outline-none focus:ring-2">
                        <Download size={14} /> Exporter cette version
                    </button>
                </div>
            )}
        </div>
    );
}

// Un projet = un ensemble de versions scellées (le coffre peut en contenir
// plusieurs).
function ProjectVault({ projectRef, certs }: { projectRef: string; certs: Certificate[] }) {
    const sorted = [...certs].sort((a, b) => b.contribution.version - a.contribution.version);

    const exportVault = useCallback(() => {
        const author = sorted[0]?.contribution.author;
        download(`coffre-${slug(projectRef)}.json`, {
            project_ref: projectRef,
            author,
            confidentiality_notice: CONFIDENTIALITY,
            certificates: sorted,
        });
    }, [projectRef, sorted]);

    return (
        <div className="mt-6 rounded-lg border border-n-border bg-n-surface p-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <History size={17} className="text-n-text-2" />
                    <h2 className="text-sm font-medium text-n-text">
                        {projectRef} — {certs.length} version{certs.length > 1 ? "s" : ""}
                    </h2>
                </div>
                <button onClick={exportVault}
                    className="inline-flex items-center gap-1.5 rounded-md border border-n-border px-2.5 py-1.5 text-xs font-medium text-n-text focus:outline-none focus:ring-2">
                    <Download size={14} /> Exporter le coffre
                </button>
            </div>
            <div className="mt-1">
                {sorted.map((cert, i) => (
                    <VersionRow key={cert.contribution.version} cert={cert} isLatest={i === 0} />
                ))}
            </div>
        </div>
    );
}

export default function MesContributionsPage() {
    const [certs, setCerts] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [projectRef, setProjectRef] = useState("");
    const [body, setBody] = useState("");
    const [sealing, setSealing] = useState(false);
    const [status, setStatus] = useState("");

    const reload = useCallback(async () => {
        try {
            setCerts(await apiList());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erreur");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const seal = useCallback(async () => {
        if (!projectRef.trim() || !body.trim()) {
            setStatus("Renseigne un titre et un texte.");
            return;
        }
        setSealing(true);
        setStatus("");
        try {
            const cert = await apiSeal(projectRef.trim(), projectRef.trim(), body);
            setCerts((cs) => [...cs, cert]);
            setStatus(`Version ${cert.contribution.version} scellée`);
        } catch (e) {
            setStatus(e instanceof Error ? e.message : "Erreur");
        } finally {
            setSealing(false);
        }
    }, [projectRef, body]);

    // Regroupe les certificats par projet.
    const groups = certs.reduce<Record<string, Certificate[]>>((acc, c) => {
        (acc[c.contribution.project_ref] ??= []).push(c);
        return acc;
    }, {});
    const projectRefs = Object.keys(groups).sort();

    return (
        <div className="mx-auto max-w-2xl p-5 text-n-text">
            <div className="mb-1 flex items-center gap-2">
                <Feather size={20} style={{ color: C.blue }} />
                <h1 className="text-xl font-semibold">Mes contributions</h1>
                <span className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                    style={{ background: C.tealBg, color: C.teal }}>
                    <Clock size={13} /> Coffre personnel
                </span>
            </div>
            <p className="mb-4 text-sm text-n-text-2">
                Ghostwriter — le texte se modifie à tout moment ; chaque scellement crée une version
                immuable, horodatée, qui survit à la suppression du projet.
            </p>

            <div className="mb-5 flex items-start gap-2 rounded-md px-3 py-2.5 text-xs"
                style={{ background: C.amberBg, color: C.amber }}>
                <Lock size={16} className="mt-0.5 shrink-0" />
                <span style={{ lineHeight: 1.5 }}>{CONFIDENTIALITY}</span>
            </div>

            {/* Composer */}
            <div className="rounded-lg border border-n-border bg-n-surface p-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Pencil size={14} className="text-n-text-2" /> Titre du morceau / projet
                </label>
                <input
                    value={projectRef}
                    onChange={(e) => setProjectRef(e.target.value)}
                    placeholder="ex. Nuit blanche"
                    className="mb-3 w-full rounded-md border border-n-border bg-n-bg p-2.5 text-sm focus:outline-none focus:ring-2"
                />

                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Pencil size={14} className="text-n-text-2" /> Paroles
                    <span className="font-normal text-n-text-2">— modifiable librement</span>
                </label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={7}
                    placeholder={"[Couplet 1]\n…"}
                    className="w-full rounded-md border border-n-border bg-n-bg p-2.5 font-mono text-xs focus:outline-none focus:ring-2"
                    style={{ lineHeight: 1.6 }}
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={seal} disabled={sealing}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 disabled:opacity-60"
                        style={{ background: C.blueBg, color: C.blue }}>
                        {sealing
                            ? <><Loader2 size={15} className="animate-spin" /> Scellement…</>
                            : <><ShieldCheck size={15} /> Sceller cette version</>}
                    </button>
                    {status && <span className="text-xs font-medium" style={{ color: C.teal }}>{status}</span>}
                </div>
            </div>

            {/* Coffre */}
            {loading ? (
                <p className="mt-6 flex items-center gap-2 text-sm text-n-text-2">
                    <Loader2 size={15} className="animate-spin" /> Chargement du coffre…
                </p>
            ) : error ? (
                <p className="mt-6 text-sm" style={{ color: C.red }}>{error}</p>
            ) : projectRefs.length === 0 ? (
                <p className="mt-6 flex items-start gap-2 text-xs text-n-text-2">
                    <FileText size={14} className="mt-0.5 shrink-0" />
                    Aucune version scellée pour l&apos;instant. Écris ton texte ci-dessus puis scelle-le
                    pour créer la première preuve datée.
                </p>
            ) : (
                projectRefs.map((ref) => (
                    <ProjectVault key={ref} projectRef={ref} certs={groups[ref]} />
                ))
            )}

            <p className="mt-5 flex items-start gap-2 text-xs text-n-text-2">
                <FileText size={14} className="mt-0.5 shrink-0" />
                Chaque version est un instantané immuable, horodaté. Modifier le texte n&apos;altère
                aucune version passée — ça en crée une nouvelle. Ouvre « Détail » pour voir
                l&apos;empreinte, le prestataire de confiance et le texte certifié de chaque version.
            </p>
        </div>
    );
}
