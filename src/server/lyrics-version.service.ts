import { prisma } from "@/lib/prisma";

// Crée un snapshot automatique
export async function createSnapshot(
    lyricsId: string,
    authorId: string
) {
    // Récupère le lyrics actuel
    const lyrics = await prisma.lyrics.findUnique({
        where: { id: lyricsId },
    });

    if (!lyrics) throw new Error("Lyrics introuvable");

    // Récupère le dernier numéro de version
    const lastVersion = await prisma.lyricVersion.findFirst({
        where: { lyricsId },
        orderBy: { version: "desc" },
    });

    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    // Crée le snapshot
    return await prisma.lyricVersion.create({
        data: {
            content: lyrics.content as any,
            version: nextVersion,
            lyricsId,
            authorId,
        },
    });
}

// Calcule le diff entre deux versions
export function calculateDiff(
    oldContent: Record<string, unknown>,
    newContent: Record<string, unknown>
): { added: string[]; removed: string[]; unchanged: string[] } {
    const oldText = extractText(oldContent);
    const newText = extractText(newContent);

    const oldLines = oldText.split("\n").filter(Boolean);
    const newLines = newText.split("\n").filter(Boolean);

    const added = newLines.filter((line) => !oldLines.includes(line));
    const removed = oldLines.filter((line) => !newLines.includes(line));
    const unchanged = oldLines.filter((line) => newLines.includes(line));

    return { added, removed, unchanged };
}

// Extrait le texte brut depuis le JSON TipTap
function extractText(content: Record<string, unknown>): string {
    if (!content || typeof content !== "object") return "";

    const texts: string[] = [];

    function traverse(node: unknown) {
        if (!node || typeof node !== "object") return;
        const n = node as Record<string, unknown>;

        if (n.type === "text" && typeof n.text === "string") {
            texts.push(n.text);
        }

        if (Array.isArray(n.content)) {
            n.content.forEach(traverse);
        }
    }

    traverse(content);
    return texts.join("\n");
}