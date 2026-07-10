import { prisma } from "@/lib/prisma";
import { resolveLyricsAccess } from "@/lib/lyricsAccess";
import { updateChordsSchema } from "@/schemas/chords.schema";

// Enveloppe de retour commune aux contrôleurs (data | error + status)
export type ControllerResult = {
    status: number;
    data?: unknown;
    error?: unknown;
};

// GET — récupère les accords d'un lyric
export async function getChords(
    cognitoId: string,
    lyricsId: string
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "READONLY");
    if (!access.ok) return { error: access.error, status: access.status };

    const chords = await prisma.chord.findMany({
        where: { lyricsId },
        orderBy: [{ sectionId: "asc" }, { position: "asc" }],
    });

    return { data: chords, status: 200 };
}

// PATCH — remplace l'ensemble des accords d'un lyric
export async function updateChords(
    cognitoId: string,
    lyricsId: string,
    body: unknown
): Promise<ControllerResult> {
    const access = await resolveLyricsAccess(cognitoId, lyricsId, "LYRICIST");
    if (!access.ok) return { error: access.error, status: access.status };

    const parsed = updateChordsSchema.safeParse(body);
    if (!parsed.success) return { error: parsed.error.flatten(), status: 400 };

    // Remplacement atomique : on repart de l'ensemble fourni par le client
    const chords = await prisma.$transaction(async (tx) => {
        await tx.chord.deleteMany({ where: { lyricsId } });
        if (parsed.data.chords.length > 0) {
            await tx.chord.createMany({
                data: parsed.data.chords.map((c) => ({
                    word: c.word,
                    position: c.position,
                    chord: c.chord,
                    sectionId: c.sectionId ?? null,
                    lyricsId,
                    createdBy: access.user.id,
                })),
            });
        }
        return tx.chord.findMany({
            where: { lyricsId },
            orderBy: [{ sectionId: "asc" }, { position: "asc" }],
        });
    });

    return { data: chords, status: 200 };
}
