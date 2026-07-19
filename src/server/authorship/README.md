# Certificat d'auteur — protection des ghostwriters

Preuve d'**antériorité** et d'**intégrité** d'une contribution rédactionnelle
(les lyrics d'un ghostwriter), conservée dans son coffre personnel et qui
**survit à la suppression du projet** par l'artiste.

Portage TypeScript, intégré à Nara, du prototype `certificat-auteur` (module
Python `PSCo` + preview React). Même algorithme d'empreinte, même format de
certificat exportable.

## Ce que ça fait (et ne fait pas)

- Calcule l'empreinte **SHA-256** du contenu écrit par l'auteur (JSON canonique,
  clés triées) — identique côté navigateur et côté serveur.
- **Horodate** cette empreinte. En prod, via un PSCo qualifié eIDAS (RFC 3161) ;
  en dev, via un horodatage serveur applicatif (sans valeur juridique).
- Produit un certificat vérifiable : « ce texte précis existait à cette date et
  n'a pas changé depuis ».

Ce certificat ne **crée aucun droit** (en France le droit d'auteur naît de la
création, CPI art. L111-1). Il sert de **preuve** en cas de litige sur la
paternité ou l'antériorité.

> ⚠️ L'horodatage prouve **quand** et **que le contenu n'a pas bougé**, pas
> **qui** a écrit. La paternité repose sur l'identité fiable de l'auteur
> (`AuthorRef.identity_assurance`), ici dérivée du compte authentifié.

## Architecture

```
src/server/authorship/
  types.ts                 Contribution, AuthorRef, Certificate, TimestampToken
  hashing.ts               empreinte SHA-256 canonique (parité navigateur/serveur)
  tsa.ts                   RFC 3161 : LocalServerTSA (dev) + QualifiedTSA (seam prod)
  certificate.service.ts   seal() / listCertificates() / verifyCertificate()
```

- Modèle Prisma : `AuthorshipCertificate` (cf. `prisma/schema.prisma`).
- Routes : `POST /api/contributions/seal`, `GET /api/contributions`,
  `POST /api/certificates/verify`.
- Page : `src/app/(main)/contributions/page.tsx` (coffre « Mes contributions »).

## Migration base de données

Le modèle `AuthorshipCertificate` a été ajouté au schéma. Après un `npm install` :

```bash
npx prisma generate          # régénère le client (types AuthorshipCertificate)
npx prisma migrate dev --name authorship_certificate   # applique la migration
# ou, sans historique de migration :
npx prisma db push
```

## Valeur juridique : dev vs production

| | `LocalServerTSA` (par défaut) | `QualifiedTSA` (production) |
|---|---|---|
| Usage | démo / dev | vrai PSCo qualifié eIDAS |
| Horodatage | serveur applicatif | RFC 3161 |
| Valeur légale | **aucune** | présomption eIDAS art. 41 |

## Brancher un vrai PSCo qualifié

`makeTSA()` (dans `tsa.ts`) bascule sur `QualifiedTSA` dès que `TSA_URL` est
défini :

```bash
TSA_URL=https://<endpoint-rfc3161-du-psco>
TSA_NAME="Certigna · Horodatage qualifié eIDAS"
TSA_CA=/chemin/chaine_racine_du_psco.pem
```

`QualifiedTSA.stamp()` / `.verify()` sont laissés **explicitement à implémenter**
(ils lèvent une erreur tant qu'ils ne sont pas branchés, pour ne jamais produire
un faux jeton « qualifié »). L'implémentation consiste à :

1. Construire la requête RFC 3161 (`.tsq`) à partir de l'empreinte.
2. La poster à `TSA_URL` (`Content-Type: application/timestamp-query`).
3. Stocker le jeton (`.tsr`) en base64 dans `tsrB64`.
4. Vérifier le jeton contre la chaîne racine (`openssl ts -verify -CAfile …`).

Le module Python d'origine (`certificat-auteur/PSCo/tsa.py`) fournit une
implémentation de référence via `openssl ts`.

## Avertissement

Information technique, pas un conseil juridique. Le texte d'engagement de
confidentialité et le choix du PSCo doivent être validés avec un avocat en
propriété intellectuelle avant mise en production.
