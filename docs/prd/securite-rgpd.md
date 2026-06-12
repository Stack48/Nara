# PRD — Sécurité : Chiffrement, Rate Limiting & RGPD

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Ticket Trello : 20-BE (Sécurité — Chiffrement, Rate Limiting & RGPD)
> Statut réel : **implémenté** (`crypto.service.ts`, `rgpd.service.ts`, `audit.service.ts`, `rateLimitAuth.ts`). Tests : `src/__tests__/security.test.ts`.

## 1. Introduction / Contexte

Les lyrics sont des œuvres inédites sensibles. Nara doit protéger ces données au repos (chiffrement), limiter les abus (rate limiting), tracer les accès (audit log) et respecter le RGPD (consentement, droit à l'oubli, export).

## 2. Objectifs

1. Chiffrement AES-256 des contenus sensibles en base.
2. Rate limiting sur les routes d'authentification.
3. Audit log des actions/accès.
4. Conformité RGPD : consentement, suppression en cascade, export des données.

## 3. User stories

- **US-1** (Léa) : mes lyrics inédits sont illisibles en cas d'accès direct à la base.
- **US-2** (tous) : être protégé contre le brute-force sur la connexion.
- **US-3** (tous) : pouvoir exporter mes données et demander leur suppression.

## 4. Exigences fonctionnelles

- **EF-1** : chiffrement AES-256-GCM dans `src/server/crypto.service.ts` — `encrypt(obj)`, `decrypt(str)`, `isEncrypted(str)`. Format `iv:tag:encrypted` (base64). Clé dérivée par `scrypt` depuis `ENCRYPTION_KEY` (env).
- **EF-2** : rate limiting des routes auth via `src/lib/rateLimitAuth.ts` (cible 10 req/min sur `/auth`).
- **EF-3** : audit log via `src/server/audit.service.ts` (table `AuditLog` : `userId, action, resource, ipAddress?, userAgent?`).
- **EF-4** : consentement RGPD via table `RgpdConsent` (`userId @unique, accepted, version`).
- **EF-5** : droit à l'oubli — `POST /api/rgpd/delete` (`src/server/rgpd.service.ts`), suppression en cascade.
- **EF-6** : export des données — `GET /api/rgpd/export` (JSON des données de l'utilisateur).

## 5. Non-objectifs (hors scope)

- **PAS de pentest externe / certification SOC 2** dans cette itération (action organisationnelle, Trello 20-BE le mentionne comme objectif long terme).
- **PAS de chiffrement des fichiers S3** ici (le chiffrement S3 relève de la config bucket/KMS, pas du `crypto.service`).
- Helmet/CORS : à confirmer (config Next.js, voir Questions ouvertes).

## 6. Considérations design / UX

- Bannière de consentement RGPD côté front, consentement loggué.
- Messages clairs sur l'export (téléchargement JSON) et la suppression (confirmation forte, irréversible).

## 7. Considérations techniques

- Stack : Node.js crypto natif (AES-256-GCM, scrypt), Prisma.
- **Clé `ENCRYPTION_KEY` obligatoire en env** — son absence fait échouer `crypto.service` (`throw`). À placer dans Secrets Manager en prod, jamais commitée.
- Lien : 13-BE (auth) et 16-BE (lyrics chiffrés).

## 8. Métriques de succès

- Lyrics illisibles en base directe (test `security.test.ts`).
- Rate limiting actif sur `/auth`.
- Export JSON disponible ; suppression en cascade effective.

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Quels champs exactement sont chiffrés (lyrics `content` ? suggestions ?) | `Lyrics.content` au minimum — à confirmer dans l'usage de `encrypt` |
| Q-2 | Helmet + CORS configurés ? | À vérifier dans `next.config.ts` / middleware |
| Q-3 | Rotation de `ENCRYPTION_KEY` (re-chiffrement) | Non géré en V1 — clé fixe |
