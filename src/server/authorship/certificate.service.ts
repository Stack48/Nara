// Service de haut niveau : sceller, lister et vérifier les certificats d'auteur.
//
// Modèle à historique de versions : le ghostwriter modifie son texte librement ;
// chaque scellement crée une VERSION immuable (empreinte + horodatage) ajoutée à
// son coffre. On ne modifie jamais une version — on en scelle une nouvelle.
//
//   seal   -> empreinte SHA-256 canonique + horodatage -> Certificate persisté
//   verify -> recalcule l'empreinte, la compare, vérifie le jeton
//   list   -> historique du coffre de l'auteur (version décroissante)

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AuthorshipCertificate } from "@prisma/client";
import { contentHashHex, toCanonicalContribution } from "./hashing";
import { makeTSA } from "./tsa";
import type { AuthorRef, Certificate, Contribution, VerificationResult } from "./types";

export const CONFIDENTIALITY_NOTICE =
  "Contenu sous engagement de confidentialité accepté à l'invitation. " +
  "Copie et export autorisés pour usage personnel et preuve d'auteur ; diffusion publique interdite.";

const tsa = makeTSA();

// Ligne Prisma -> certificat « fil » (format exporté / vérifiable).
function toCertificate(row: AuthorshipCertificate): Certificate {
  return {
    contribution: row.canonicalSnapshot as unknown as Contribution,
    content_hash_hex: row.contentHashHex,
    timestamp: {
      tsr_b64: row.tsrB64,
      tsa_name: row.tsaName,
      qualified: row.qualified,
      gen_time: row.sealedAt.toISOString(),
      hash_algorithm: "sha256",
    },
    confidentiality_notice: row.confidentialityNotice,
    sealed_at_local: row.createdAt.toISOString(),
  };
}

// Numéro de la prochaine version pour un couple (auteur, projet).
async function nextVersion(authorId: string, projectRef: string): Promise<number> {
  const last = await prisma.authorshipCertificate.findFirst({
    where: { authorId, projectRef },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return last ? last.version + 1 : 1;
}

// Scelle une nouvelle version de contribution dans le coffre de l'auteur.
// L'identité de l'auteur est TOUJOURS dérivée du compte authentifié (jamais
// fournie par le client) : c'est elle qui étaie la paternité.
export async function sealContribution(params: {
  author: AuthorRef;
  authorId: string;
  lyricsId?: string | null;
  projectRef: string;
  title: string;
  body: string;
}): Promise<Certificate> {
  const version = await nextVersion(params.authorId, params.projectRef);

  const contribution: Contribution = toCanonicalContribution({
    project_ref: params.projectRef,
    title: params.title,
    role: "ghostwriter",
    body: params.body,
    version,
    created_at: new Date().toISOString(),
    author: params.author,
  });

  const digest = contentHashHex(contribution);
  const token = await tsa.stamp(digest);
  const sealedAt = token.gen_time ? new Date(token.gen_time) : new Date();

  const row = await prisma.authorshipCertificate.create({
    data: {
      version,
      contentHashHex: digest,
      canonicalSnapshot: contribution as unknown as Prisma.InputJsonValue,
      projectRef: contribution.project_ref,
      title: contribution.title,
      tsaName: token.tsa_name,
      qualified: token.qualified,
      tsrB64: token.tsr_b64,
      sealedAt,
      confidentialityNotice: CONFIDENTIALITY_NOTICE,
      lyricsId: params.lyricsId ?? null,
      authorId: params.authorId,
    },
  });

  return toCertificate(row);
}

// Historique du coffre de l'auteur, éventuellement filtré par projet / lyrics.
export async function listCertificates(params: {
  authorId: string;
  projectRef?: string;
  lyricsId?: string;
}): Promise<Certificate[]> {
  const rows = await prisma.authorshipCertificate.findMany({
    where: {
      authorId: params.authorId,
      ...(params.projectRef ? { projectRef: params.projectRef } : {}),
      ...(params.lyricsId ? { lyricsId: params.lyricsId } : {}),
    },
    orderBy: [{ projectRef: "asc" }, { version: "desc" }],
  });
  return rows.map(toCertificate);
}

// Vérifie un certificat de bout en bout (empreinte + jeton). Fonctionne aussi
// sur un certificat exporté hors base — source de vérité côté serveur.
export async function verifyCertificate(cert: Certificate): Promise<VerificationResult> {
  const recomputed = contentHashHex(cert.contribution);
  const hashMatches = recomputed === cert.content_hash_hex;
  const timestampValid = await tsa.verify(cert.content_hash_hex, cert.timestamp.tsr_b64);
  const qualified = cert.timestamp.qualified;
  const ok = hashMatches && timestampValid;

  let details: string;
  if (!hashMatches) {
    details = "Contenu modifié : l'empreinte ne correspond plus au jeton.";
  } else if (!timestampValid) {
    details = "Jeton d'horodatage invalide ou non émis par cette autorité.";
  } else if (!qualified) {
    details = "Vérifié, mais horodatage NON qualifié (démo) : valeur probante faible.";
  } else {
    details =
      "Vérifié : horodatage qualifié eIDAS, présomption de date et d'intégrité " +
      "(art. 41), charge de la preuve inversée.";
  }

  return {
    ok,
    hashMatches,
    timestampValid,
    qualified,
    sealedDate: cert.timestamp.gen_time,
    details,
  };
}
