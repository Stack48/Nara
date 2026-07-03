import { z } from "zod";

// Requête de scellement d'une nouvelle version. L'identité de l'auteur et le
// numéro de version sont dérivés côté serveur — le client ne fournit que le
// projet, le titre et le texte.
export const sealContributionSchema = z.object({
    lyricsId: z.string().min(1).nullable().optional(),
    projectRef: z.string().min(1, "La référence de projet est requise").max(200),
    title: z.string().min(1, "Le titre est requis").max(200),
    body: z.string().min(1, "Le texte est requis"),
});

// Auteur tel que sérialisé dans un certificat (pour la vérification d'un
// certificat exporté).
export const authorRefSchema = z.object({
    user_id: z.string(),
    display_name: z.string(),
    email: z.string().nullable(),
    identity_assurance: z.string(),
});

export const contributionSchema = z.object({
    project_ref: z.string(),
    title: z.string(),
    role: z.string(),
    body: z.string(),
    version: z.number().int(),
    created_at: z.string(),
    author: authorRefSchema,
});

// Certificat complet accepté par l'endpoint de vérification.
export const certificateSchema = z.object({
    contribution: contributionSchema,
    content_hash_hex: z.string(),
    timestamp: z.object({
        tsr_b64: z.string().default(""),
        tsa_name: z.string(),
        qualified: z.boolean(),
        gen_time: z.string().nullable().optional(),
        hash_algorithm: z.string().default("sha256"),
    }),
    confidentiality_notice: z.string().default(""),
    sealed_at_local: z.string().default(""),
});

export type SealContributionInput = z.infer<typeof sealContributionSchema>;
export type CertificateInput = z.infer<typeof certificateSchema>;
