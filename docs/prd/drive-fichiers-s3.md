# PRD — Drive & Stockage de Fichiers (AWS S3)

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Tickets Trello : 19-BE (Drive & Stockage AWS S3), 32-FE (Drive Intégré UI)
> Statut réel : **implémenté** côté back (`src/server/s3.service.ts`, routes files). Tests : `src/__tests__/s3.test.ts`. UI 32-FE marquée terminée.

## 1. Introduction / Contexte

Les utilisateurs uploadent des fichiers (audio, PDF) liés à leurs projets. Le stockage est sur AWS S3, avec des URLs signées pour la lecture et une synchronisation stricte entre S3 et la base (métadonnées dans la table `File`).

## 2. Objectifs

1. Upload de fichiers vers S3, rattachés à un projet.
2. Lecture via URLs signées à expiration.
3. Contrôle de taille et de type MIME.
4. Suppression synchronisée S3 ↔ DB.

## 3. User stories

- **US-1** (Léa) : uploader et organiser mes fichiers audio et PDF par projet.
- **US-2** (Marcus) : accéder aux fichiers des projets où je suis membre.
- **US-3** (Romain) : accéder en lecture seule aux fichiers audio.

## 4. Exigences fonctionnelles

- **EF-1** : `GET/POST /api/projects/[id]/files` (liste / upload), `DELETE /api/projects/[id]/files/[fileId]`.
- **EF-2** : service S3 dans `src/server/s3.service.ts` (upload, presigned URL, suppression).
- **EF-3** : presigned URLs avec expiration (cible 1h).
- **EF-4** : limite de taille (cible 50 MB) et whitelist MIME ; fichier non conforme → erreur claire.
- **EF-5** : métadonnées en base (`File` : `name, originalName, mimeType, size, s3Key @unique, s3Bucket, projectId, uploadedBy`).
- **EF-6** : suppression DB ⇒ suppression S3 (et inversement, pas d'orphelin).
- **EF-7** : accès aux fichiers soumis au rôle projet (réutilise `requireRole`).

## 5. Non-objectifs (hors scope)

- **PAS de versionnage de fichiers** (un upload écrase ou crée une nouvelle entrée, pas d'historique binaire).
- **PAS de prévisualisation côté serveur** : l'aperçu audio/PDF est natif navigateur (32-FE).
- Retry logic S3 (x3) : à confirmer dans `s3.service.ts` (voir Questions ouvertes).

## 6. Considérations design / UX (32-FE)

- Upload drag & drop (`react-dropzone`), barre de progression, organisation par projet/album, aperçu audio natif, lecture seule sans bouton upload selon le rôle.

## 7. Considérations techniques

- Stack : Node.js, AWS SDK S3, PostgreSQL/Prisma.
- Variables : `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` (dans `.env`, vides en local sans AWS).
- Lien avec 21-BE : les fichiers audio servent de support aux smart markers.

## 8. Métriques de succès

- Upload fonctionnel (PDF + audio), > 50 MB rejeté, URLs signées expirent, suppression synchronisée (test `s3.test.ts`).

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Retry logic x3 sur panne S3 présente ? | À vérifier/ajouter dans `s3.service.ts` |
| Q-2 | Durée d'expiration des presigned URLs | 1h |
| Q-3 | Limite de taille exacte | 50 MB |
