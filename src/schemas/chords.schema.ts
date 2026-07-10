import { z } from "zod";

export const chordSchema = z.object({
    word: z.string().min(1, "Mot requis"),
    position: z.number().int().min(0, "Position invalide"),
    chord: z.string().min(1, "Accord requis"),
    sectionId: z.string().optional(),
});

// PATCH remplace l'ensemble des accords d'un lyric
export const updateChordsSchema = z.object({
    chords: z.array(chordSchema),
});

export type ChordInput = z.infer<typeof chordSchema>;
export type UpdateChordsInput = z.infer<typeof updateChordsSchema>;
