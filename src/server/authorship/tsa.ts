// Horodatage RFC 3161 — abstraction d'autorité d'horodatage (TSA).
//
// Deux implémentations, comme le module Python d'origine :
//  - LocalServerTSA : horodatage serveur applicatif (démo / dev). AUCUNE valeur
//    juridique (qualified=false) : la date est simplement enregistrée par notre
//    serveur. L'intégrité, elle, est réelle (SHA-256).
//  - QualifiedTSA   : seam de production vers un PSCo qualifié eIDAS (Certigna,
//    Datasure, Evidency, Docaposte, APP…). Le jeton bénéficie alors de la
//    présomption eIDAS (art. 41). À brancher via les variables d'environnement
//    TSA_URL / TSA_NAME / TSA_CA.
//
// L'autorité ne reçoit qu'une EMPREINTE (hash), jamais les lyrics : la
// confidentialité du texte est préservée même côté TSA.

import type { TimestampToken } from "./types";

export interface TimestampAuthority {
  name: string;
  qualified: boolean;
  stamp(digestHex: string): Promise<TimestampToken>;
  verify(digestHex: string, tsrB64: string): Promise<boolean>;
}

// Horodatage serveur applicatif — démo / dev, non qualifié.
export class LocalServerTSA implements TimestampAuthority {
  readonly name = "Nara · Horodatage serveur (démo, sans valeur juridique)";
  readonly qualified = false;

  async stamp(_digestHex: string): Promise<TimestampToken> {
    return {
      tsr_b64: "",
      tsa_name: this.name,
      qualified: this.qualified,
      gen_time: new Date().toISOString(),
      hash_algorithm: "sha256",
    };
  }

  // Sans jeton RFC 3161, l'horodatage vaut ce que vaut notre enregistrement
  // serveur : on le considère « valide » (la date existe en base), mais NON
  // qualifié — l'UI signale la valeur probante faible. L'intégrité réelle est
  // contrôlée séparément par la comparaison d'empreinte.
  async verify(_digestHex: string, _tsrB64: string): Promise<boolean> {
    return true;
  }
}

// Seam de production vers un PSCo qualifié eIDAS.
//
// Brancher un vrai PSCo demande de construire une requête RFC 3161 (.tsq) à
// partir de l'empreinte, de la poster à l'URL du PSCo, puis de vérifier le
// jeton (.tsr) contre sa chaîne racine. La façon la plus fiable de le faire est
// de s'appuyer sur `openssl ts` (comme le module Python) ou une lib ASN.1
// dédiée. Ce point est laissé explicitement à implémenter pour ne pas produire
// un faux jeton « qualifié » : tant que ce n'est pas branché, on refuse de
// prétendre à la qualification.
export class QualifiedTSA implements TimestampAuthority {
  readonly qualified = true;
  constructor(
    readonly url: string,
    readonly name: string,
    private readonly caChainPath: string,
  ) {}

  async stamp(_digestHex: string): Promise<TimestampToken> {
    throw new Error(
      "QualifiedTSA non implémentée : brancher le PSCo qualifié (RFC 3161 via " +
        "openssl ts ou lib ASN.1) avant de sceller en mode qualifié. " +
        `URL=${this.url}, CA=${this.caChainPath}. Voir src/server/authorship/README.md.`,
    );
  }

  async verify(_digestHex: string, _tsrB64: string): Promise<boolean> {
    throw new Error(
      "QualifiedTSA.verify non implémentée : vérifier le jeton .tsr contre la " +
        "chaîne racine du PSCo (openssl ts -verify).",
    );
  }
}

// Fabrique la TSA selon l'environnement (parité avec make_tsa() côté Python).
// Par défaut : horodatage serveur non qualifié. Si TSA_URL est défini, on
// bascule sur le seam qualifié.
export function makeTSA(): TimestampAuthority {
  const url = process.env.TSA_URL;
  if (url) {
    return new QualifiedTSA(
      url,
      process.env.TSA_NAME ?? "PSCo qualifié eIDAS",
      process.env.TSA_CA ?? "",
    );
  }
  return new LocalServerTSA();
}
