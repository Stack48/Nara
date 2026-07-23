// Empreinte (hash) déterministe d'une contribution.
//
// On sérialise la contribution en JSON canonique (clés triées récursivement,
// UTF-8, séparateurs par défaut de JSON.stringify) puis on calcule un SHA-256.
// La même contribution donne toujours la même empreinte ; le moindre changement
// de contenu donne une empreinte différente — c'est l'intégrité.
//
// L'algorithme est STRICTEMENT identique côté navigateur (Web Crypto, cf. la
// page « Mes contributions ») et côté module Python d'origine, pour que la
// vérification donne le même résultat partout.

import crypto from "crypto";
import type { Contribution } from "./types";

// Trie les clés d'objet récursivement (même logique que le navigateur).
export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

// Force la forme exacte des champs hachés (parité avec le module Python).
export function toCanonicalContribution(c: Contribution): Contribution {
  return {
    project_ref: c.project_ref,
    title: c.title,
    role: c.role,
    body: c.body,
    version: c.version,
    created_at: c.created_at,
    author: {
      user_id: c.author.user_id,
      display_name: c.author.display_name,
      email: c.author.email ?? null,
      identity_assurance: c.author.identity_assurance,
    },
  };
}

// Empreinte SHA-256 (hexadécimal minuscule) du contenu canonique.
export function contentHashHex(contribution: Contribution): string {
  const canon = JSON.stringify(canonicalize(toCanonicalContribution(contribution)));
  return crypto.createHash("sha256").update(Buffer.from(canon, "utf8")).digest("hex");
}
