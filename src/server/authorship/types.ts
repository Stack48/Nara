// Types du certificat d'auteur — contrat « fil » (snake_case) partagé entre le
// serveur, le navigateur et le JSON exporté dans le coffre de l'auteur.
// Format identique à celui du module Python d'origine (PSCo) pour que les
// certificats exportés restent interopérables et re-vérifiables.

export interface AuthorRef {
  user_id: string;
  display_name: string;
  email: string | null;
  // Comment l'identité a été établie ; l'horodatage ne couvre pas ce point.
  // ex: "compte_authentifie" | "signature_qualifiee_eidas"
  identity_assurance: string;
}

// Une contribution rédactionnelle versionnée (les lyrics d'un ghostwriter).
// Volontairement sans audio : on ne scelle que ce que l'auteur a écrit.
export interface Contribution {
  project_ref: string;
  title: string;
  role: string;
  body: string;
  version: number;
  created_at: string; // ISO 8601, horloge applicative (indicatif)
  author: AuthorRef;
}

// Jeton d'horodatage RFC 3161 renvoyé par l'autorité (TSA).
export interface TimestampToken {
  tsr_b64: string; // jeton .tsr encodé base64 (vide si TSA locale non qualifiée)
  tsa_name: string;
  qualified: boolean; // true si PSCo qualifié eIDAS
  gen_time: string | null; // date scellée (ISO 8601)
  hash_algorithm: string; // "sha256"
}

// Le certificat conservé dans le coffre. Indépendant du projet : il survit à la
// suppression du projet par l'artiste.
export interface Certificate {
  contribution: Contribution;
  content_hash_hex: string;
  timestamp: TimestampToken;
  confidentiality_notice: string;
  sealed_at_local: string;
}

export interface VerificationResult {
  ok: boolean;
  hashMatches: boolean;
  timestampValid: boolean;
  qualified: boolean;
  sealedDate: string | null;
  details: string;
}
