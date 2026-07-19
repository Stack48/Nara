"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Loader2, Check, X } from "lucide-react";
import "@/lib/amplify";

/**
 * Bouton « Sceller cette version » de l'éditeur de lyrics.
 *
 * Scelle la dernière version ENREGISTRÉE des lyrics dans le coffre « Mes
 * contributions » de l'auteur : empreinte SHA-256 + horodatage, version
 * immuable qui survit à la suppression du projet. Découplé de l'état interne de
 * l'éditeur — il lit la version persistée via l'API, que l'éditeur autosauve.
 */

interface Props {
    lyricsId: string;
}

type Phase =
    | { kind: "idle" }
    | { kind: "sealing" }
    | { kind: "done"; version: number }
    | { kind: "error"; message: string };

// Extrait le texte brut d'un contenu TipTap (nœuds { type: "text", text }).
function extractText(node: unknown): string {
    const out: string[] = [];
    const walk = (n: unknown) => {
        if (!n || typeof n !== "object") return;
        const rec = n as Record<string, unknown>;
        if (rec.type === "text" && typeof rec.text === "string") out.push(rec.text);
        if (Array.isArray(rec.content)) rec.content.forEach(walk);
        // Un saut de paragraphe = une nouvelle ligne.
        if (rec.type === "paragraph") out.push("\n");
    };
    walk(node);
    return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export default function SealContributionButton({ lyricsId }: Props) {
    const [phase, setPhase] = useState<Phase>({ kind: "idle" });

    const seal = useCallback(async () => {
        setPhase({ kind: "sealing" });
        try {
            const { getCurrentUser } = await import("aws-amplify/auth");
            const user = await getCurrentUser();
            const headers = { "x-cognito-id": user.userId };

            // 1) Récupère la dernière version enregistrée des lyrics.
            const res = await fetch(`/api/lyrics/${lyricsId}`, { headers });
            if (!res.ok) throw new Error("Lyrics introuvables");
            const lyrics = await res.json();

            const body = extractText(lyrics.content);
            if (!body) throw new Error("Rien à sceller : le texte est vide.");

            const projectRef: string = lyrics.project?.name || lyrics.title || "Sans titre";
            const title: string = lyrics.title || projectRef;

            // 2) Scelle une nouvelle version dans le coffre.
            const sealRes = await fetch("/api/contributions/seal", {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ lyricsId, projectRef, title, body }),
            });
            if (!sealRes.ok) throw new Error("Scellement impossible");
            const cert = await sealRes.json();

            setPhase({ kind: "done", version: cert.contribution.version });
        } catch (e) {
            setPhase({ kind: "error", message: e instanceof Error ? e.message : "Erreur" });
        }
    }, [lyricsId]);

    return (
        <div className="pointer-events-auto flex flex-col items-end gap-2">
            {phase.kind === "done" && (
                <div className="flex items-center gap-2 rounded-lg border border-n-border bg-n-surface px-3 py-2 text-xs text-n-text shadow-lg">
                    <Check size={14} className="text-emerald-600" />
                    Version {phase.version} scellée ·{" "}
                    <Link href="/contributions" className="font-medium underline">
                        voir le coffre
                    </Link>
                </div>
            )}
            {phase.kind === "error" && (
                <div className="flex items-center gap-2 rounded-lg border border-n-border bg-n-surface px-3 py-2 text-xs text-red-600 shadow-lg">
                    <X size={14} /> {phase.message}
                </div>
            )}
            <button
                type="button"
                onClick={seal}
                disabled={phase.kind === "sealing"}
                title="Sceller cette version dans « Mes contributions »"
                className="inline-flex items-center gap-2 rounded-full border border-n-border bg-n-surface px-4 py-2.5 text-sm font-medium text-n-text shadow-lg transition hover:bg-n-hover focus:outline-none focus:ring-2 disabled:opacity-60"
            >
                {phase.kind === "sealing" ? (
                    <>
                        <Loader2 size={16} className="animate-spin" /> Scellement…
                    </>
                ) : (
                    <>
                        <ShieldCheck size={16} /> Sceller cette version
                    </>
                )}
            </button>
        </div>
    );
}
