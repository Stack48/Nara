# PRD — Projets, Éditeur de Lyrics & Versionnage

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Tickets Trello : 15-BE (Projets CRUD), 16-BE (Lyrics & Sections CRUD), 17-BE (Versionnage), 28-FE (Éditeur TipTap), 29-FE (Timeline & Diff)
> Statut réel : **implémenté** côté back (controllers + routes + tests `projects.test.ts`, `lyrics.test.ts`, `lyrics-version.test.ts`) ; éditeur front 28-FE en cours d'affinage.

## 1. Introduction / Contexte

Le cœur de Nara : un projet musical contient des lyrics structurés en sections (couplet, refrain, pont…). Les paroliers écrivent dans un éditeur riche (TipTap/ProseMirror) dont le contenu est sérialisé en JSON. Chaque sauvegarde crée une version pour pouvoir consulter l'historique et restaurer.

## 2. Objectifs

1. CRUD complet des projets, isolé par utilisateur/rôle.
2. CRUD des lyrics & sections, contenu JSON TipTap fidèlement persisté.
3. Versionnage automatique à chaque sauvegarde + restauration.
4. UI éditeur (sections, drag & drop) et UI timeline/diff.

## 3. User stories

- **US-1** (Léa) : créer/modifier/supprimer mes projets.
- **US-2** (Marcus) : accéder aux projets où je suis invité, écrire des lyrics.
- **US-3** (Léa, Marcus) : structurer en sections, réordonner par drag & drop, sauvegarder sans perte.
- **US-4** (Léa) : consulter l'historique des versions, comparer (diff), restaurer une version antérieure.

## 4. Exigences fonctionnelles

### Projets (15-BE)
- **EF-1** : `GET /api/projects` liste les projets dont l'user est owner OU membre.
- **EF-2** : `POST /api/projects` crée (créateur = membre `ADMIN`). `GET/PATCH/DELETE /api/projects/[id]`.
- **EF-3** : accès projet d'autrui sans rôle → 403 ; modif réservée `LEAD_LYRICIST`+ ; statut `ADMIN` only ; suppression owner only.
- **EF-4** : validation `src/schemas/project.schema.ts`. Logique : `src/server/projects/controller.ts`.

### Lyrics & Sections (16-BE)
- **EF-5** : `GET/POST /api/projects/[id]/lyrics`, `PATCH /api/projects/[id]/lyrics/[lyricsId]`.
- **EF-6** : contenu stocké en JSON (champ `Lyrics.content Json`), type de section via enum `SectionType` (`COUPLET, REFRAIN, PONT, INTRO, OUTRO, BRIDGE`), ordre via `Lyrics.order`.
- **EF-7** : suggestions soumises à validation via `src/app/api/projects/[id]/lyrics/[lyricsId]/suggestions/route.ts` (modèle `Suggestion`, statut `SuggestionStatus`).

### Versionnage (17-BE)
- **EF-8** : snapshot à chaque sauvegarde dans `LyricVersion` (service `src/server/lyrics-version.service.ts`, controller `src/server/lyrics-versions/controller.ts`).
- **EF-9** : `GET /api/projects/[id]/lyrics/[lyricsId]/versions` (historique), `POST .../restore` (restauration = nouveau snapshot).
- **EF-10** : diff calculé par comparaison JSON ; affiché en vert (ajouts) / rouge (suppressions) côté front (29-FE).

## 5. Non-objectifs (hors scope)

- **PAS d'auto-save temps réel** ici : sauvegarde déclenchée (bouton). Le temps réel collaboratif relève de 18-BE (voir [collaboration-temps-reel](./collaboration-temps-reel.md)).
- **PAS de chiffrement** décrit ici : couvert par 20-BE (voir [securite-rgpd](./securite-rgpd.md)).
- Dossier `src/app/api/projects/[id]/lyrics/{lyricsId]/` (accolade) : **bug de nommage** à corriger — voir Questions ouvertes.

## 6. Considérations design / UX

- Éditeur : `src/components/LyricsEditor/` (FocusLyricsDocument, LyricsEditorWorkspace, TrackPlayer, LyricsInspector…).
- TipTap nodes custom par section ; drag & drop des lignes/sections ; contenu intact après rechargement.

## 7. Considérations techniques

- Stack : Next.js, Prisma, TipTap (ProseMirror), Zod.
- Modèles : `Project`, `Lyrics`, `Suggestion`, `LyricVersion` (cf. `prisma/schema.prisma`).
- Contenu legacy parfois `{type:"text"}` au lieu de `{type:"doc"}` → normalisation via `getParagraphTextNodes` (cf. `docs/HANDOFF.md`).

## 8. Métriques de succès

- Contenu sauvegardé/restauré fidèlement (tests `lyrics.test.ts`).
- Chaque modif crée un snapshot ; restauration crée un nouveau snapshot (`lyrics-version.test.ts`).
- Sections ordonnées et persistées après drag & drop.

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Renommer le dossier `{lyricsId]` (accolade parasite) en `[lyricsId]` ? | Oui — à corriger, risque de route morte |
| Q-2 | Limiter le nombre de versions conservées par lyric ? | Non en V1, surveiller la volumétrie |
| Q-3 | Diff au niveau ligne ou mot ? | Ligne en V1 |
