# HANDOFF — Nara · État global du projet

> 🧭 [← docs/](./README.md) · [roadmap](./roadmap-trello.md)

> Dernière mise à jour : 2026-06-11 par Claude Code
> Branche : `lyrics-editor_BackEnd`
>
> **Documents liés** :
> - [roadmap-trello.md](./roadmap-trello.md) — board complet, 48 tickets
> - PRD par domaine : [auth & permissions](./prd/auth-permissions.md) · [projets/lyrics/versions](./prd/projets-lyrics-versions.md) · [collaboration temps réel](./prd/collaboration-temps-reel.md) · [drive S3](./prd/drive-fichiers-s3.md) · [sécurité & RGPD](./prd/securite-rgpd.md) · [audio & markers](./prd/audio-markers.md) · [outils linguistiques](./prd/outils-linguistiques.md) · [dictionnaire communautaire](./prd/dictionnaire-communautaire.md)

## 1. Mission en cours

Finaliser le **back-end du dictionnaire communautaire** (43-BE / 48-BE) et l'affinage de l'éditeur lyrics front (28-FE, 30-FE, 35-FE). Le reste du back-end est déjà construit (voir §2).

> ⚠️ **Le Trello est périmé** : presque tous les tickets back-end marqués « En cours » sont en réalité **implémentés** dans le code (controllers + routes + tests Jest). Ne pas repartir de zéro — lire le PRD du domaine concerné avant de toucher quoi que ce soit.

## 2. État actuel

### État réel par domaine (vs Trello)

| Domaine | Tickets | Code | PRD | Statut réel |
|---|---|---|---|---|
| Auth & permissions | 13/14-BE, 26/31-FE | `lib/rbac.ts`, `middleware/rbac.middleware.ts`, `server/members`, `server/auth` | [prd](./prd/auth-permissions.md) | ✅ build (Cognito **simulé** via header `x-cognito-id`) |
| Projets / Lyrics / Versions | 15/16/17-BE, 28/29-FE | `server/projects`, `server/lyrics-version*`, routes lyrics | [prd](./prd/projets-lyrics-versions.md) | ✅ back · 🔄 éditeur front |
| Collaboration temps réel | 18-BE, 33-FE | `server/collaboration/*`, `server/socket.server.ts`, `redis.client.ts` | [prd](./prd/collaboration-temps-reel.md) | ✅ serveur · 🔄 UI curseurs (33-FE) |
| Drive S3 | 19-BE, 32-FE | `server/s3.service.ts`, routes files | [prd](./prd/drive-fichiers-s3.md) | ✅ |
| Sécurité & RGPD | 20-BE | `server/crypto.service.ts`, `rgpd.service.ts`, `audit.service.ts`, `rateLimitAuth.ts` | [prd](./prd/securite-rgpd.md) | ✅ (pentest/SOC2 hors scope) |
| Audio & markers | 21-BE, 35-FE | `server/bridge-audio.service.ts`, routes markers/label-copy | [prd](./prd/audio-markers.md) | ✅ back · 🔄 player front |
| Outils linguistiques | 30-FE | `lib/lexique.ts`, `lib/dicolink.ts`, `hooks/useLinguistic.ts` | [prd](./prd/outils-linguistiques.md) | ✅ (refactor filtres 🔄) |
| Dictionnaire communautaire | 43/45/46/47/48 | `server/dictionary/controller.ts`, routes dictionary + admin | [prd](./prd/dictionnaire-communautaire.md) | 🔄 en cours (43/48 entamés) |
| Dictionnaire — crawling | 44-BE | `server/crawl/**` (crawlers datamuse/free-dict/wiktionary, job, service), routes admin+cron | [prd](./prd/dictionnaire-crawling.md) | ✅ (datasets lourds à venir) |

### Fait récemment ✅
- **Migrations Prisma réparées** : historique squashé en 2 migrations propres (`20260611085034_baseline` + `20260611095811_extend_word_suggestion`). `prisma migrate status` et `migrate dev` passent.
- **Schéma dictionnaire** : `WordSuggestion` étendu (`category`, `language`, `authorId`) + modèle `WordVote` (1 vote/user via `@@unique([wordId, userId])`). Appliqué en DB.
- **API dictionnaire** : routes publiques + admin (CRUD, vote, stats, modération) — logique dans `src/server/dictionary/controller.ts`.
- **Front éditeur** : fixes z-index/drag&drop/duplicate section, formatage focus-mode, filtres syllabes+catégorie sur tous les panneaux, hit-zone markers TrackPlayer + annotation clic-droit.
- **8 PRD + roadmap** créés dans `docs/` (ce HANDOFF + les liens en tête).

### En cours 🔄
- Vérification end-to-end des routes dictionnaire (EF-1 → EF-11 du PRD dictionnaire).
- Refactor `src/components/lyricsEditor/LyricsInspector.tsx` : `rhymeFilters` → `filtersByPanel` générique — **INCOMPLET**, le call-site de `LyricsInspectorPanelCard` utilise encore les anciens noms de props.

### Reste à faire ⬜ (prochaine action en premier)
1. **Corriger le dossier de route malformé** `src/app/api/projects/[id]/lyrics/{lyricsId]/` (accolade `{` au lieu de `[`) → route lyrics-by-id + suggestions probablement morte. Renommer en `[lyricsId]`.
2. **Tester les routes dictionnaire** contre le PRD (pagination, filtres, vote unique/remplacement, seuil auto-verified, 403 admin pour non-admin).
3. **Vérifier le seuil auto-verified** (EF-6, défaut 10) dans `dictionary/controller.ts`.
4. **Terminer le refactor LyricsInspector** (props `panelId`-based sur la card).
5. **44-BE crawling = déjà construit** (`server/crawl/**`) — voir [prd/dictionnaire-crawling.md](./prd/dictionnaire-crawling.md). Restes : curseur de reprise des seeds (Q-1), auth admin sur RBAC réel, imports datasets lourds (Lexique.org/DBnary).

## 3. Décisions prises — et POURQUOI

| Décision | Pourquoi | Alternative rejetée |
|---|---|---|
| **Migrations squashées en baseline unique** (11/06) | Les 10 anciennes migrations étaient des snapshots complets non-incrémentaux : chacune refaisait `CREATE TYPE "Role"` → toute exécution échouait (`type "Role" already exists`, P3006/P3018). Irréparables. | `IF NOT EXISTS` patch par fichier — trop fragile, enums incohérents entre fichiers (FR `LEAD_PAROLIER` vs EN `LEAD_LYRICIST`) |
| **NE PAS restaurer les anciennes migrations** (backup dans `../migrations SAUVE/`) | Elles recasseraient tout. Elles sont encore dans l'historique git (HEAD) — un `git checkout prisma/migrations` les ferait revenir : **ne pas le faire**, et commit les 2 nouvelles dès que possible pour écraser. | — |
| Rôles enum en **anglais** (`LEAD_LYRICIST`) avec mapping FR→EN dans `rbac.middleware.ts` | Du code existant utilise encore les noms français ; le mapping évite une migration de données et des breaking changes | Renommage global immédiat |
| Auth simulée via `getOrCreateUser(cognitoId)` dans le controller | 13-BE (Cognito) pas encore livré ; débloquer le dev du dictionnaire sans attendre | Attendre 13-BE |
| Statut des mots en `String` (`"PENDING"`) sur `WordSuggestion`, pas l'enum `SuggestionStatus` | Choix existant du modèle (champ `status String @default("PENDING")`) ; ne pas migrer tant que l'API n'est pas stabilisée | Migration vers enum maintenant |

## 4. Fichiers concernés

| Fichier | Rôle |
|---|---|
| `prisma/schema.prisma` | Schéma complet, source de vérité (WordSuggestion + WordVote inclus) |
| `prisma/migrations/20260611085034_baseline/` | Migration squashée (tout le schéma pré-dictionnaire) |
| `prisma/migrations/20260611095811_extend_word_suggestion/` | Ajout category/language/authorId + table WordVote |
| `src/server/dictionary/controller.ts` | Toute la logique métier dictionnaire (CRUD, votes, stats, modération) |
| `src/schemas/dictionary.schema.ts` | Validation Zod des entrées |
| `src/middleware/rbac.middleware.ts` | Vérification rôles + mapping FR→EN |
| `src/app/api/dictionary/**` | Route handlers publics (minces, délèguent au controller) |
| `src/app/api/admin/dictionary/**` | Route handlers admin (file de modération, stats) |
| `src/app/(main)/dictionary/`, `src/app/(main)/admin/` | Pages front |
| `src/components/dictionary/` | WordCard, SuggestWordModal, EditModerationModal |
| `src/components/LyricsEditor/FocusLyricsDocument.tsx` | Éditeur focus-mode (drag&drop, formatage, overlays) |
| `src/components/LyricsEditor/LyricsEditorWorkspace.tsx` | Orchestrateur éditeur (état, mutations structurelles) |
| `src/components/lyricsEditor/LyricsInspector.tsx` | Panneaux linguistiques — **refactor filtres INCOMPLET** |

## 5. Commandes utiles

```bash
# Infra locale (Postgres 5432, Redis 6379, pgAdmin 5050)
docker compose up -d db redis

# Dev
npm run dev

# Prisma
npx prisma migrate status        # doit dire "Database schema is up to date!"
npx prisma migrate dev           # nouvelle migration après modif du schéma
npx prisma generate              # régénérer le client
npx prisma studio                # inspecter la base

# Connexion DB (cf. .env)
# postgresql://nara:nara_secret@localhost:5432/nara
```

## 6. Pièges connus (gotchas)

- **`prisma generate` échoue avec `EPERM ... query_engine-windows.dll.node`** si le serveur dev Next tourne (la DLL est verrouillée). Arrêter `npm run dev`, relancer generate. Sans gravité si le client est déjà à jour.
- **Ne jamais faire `git checkout prisma/migrations`** : ça restaure les 10 migrations corrompues depuis HEAD (voir Décisions). Si ça arrive : supprimer les 10 dossiers restaurés, garder uniquement `20260611085034_baseline` et `20260611095811_extend_word_suggestion`.
- **Checksums migrations** : si `migrate dev` propose un reset alors que `migrate status` est OK, c'est un mismatch de checksum dans `_prisma_migrations` (fichier modifié après application). Réparé le 11/06 en recalculant les sha256 — ne pas éditer les fichiers de migration appliqués.
- **Éditeur focus-mode** : les mutations structurelles (duplicate/add/delete section, add line) doivent appeler `setFocusDraftText(null)` sinon le draft écrase les sections suivantes.
- **Drag & drop HTML5** : Chrome annule le drag si l'élément source est masqué pendant `dragstart` → `setDraggedLineIdx` est différé avec `setTimeout(0)`. Ne pas "simplifier" ça.
- **TipTap content legacy** : certaines lignes sont stockées `{type:"text"}` au lieu de `{type:"doc"}` — `getParagraphTextNodes` normalise, toujours passer par lui.
- **`.env` contient une vraie clé `DICOLINK_API_KEY`** — ne pas committer `.env`.
- **Dossier de route malformé** : `src/app/api/projects/[id]/lyrics/{lyricsId]/` utilise une accolade `{` au lieu d'un crochet `[`. Next.js ne le reconnaît pas comme segment dynamique → la route (et sa sous-route `suggestions`) est probablement inopérante. À renommer en `[lyricsId]`.
- **`ENCRYPTION_KEY` obligatoire** : `crypto.service.ts` lève une exception si absente de `.env`. La définir en local sinon les routes touchant au chiffrement plantent.
- **Auth simulée** : l'identité passe par l'en-tête `x-cognito-id` (pas de vérification JWT réelle). Toute route protégée le lit via `getCognitoId`. Ne pas confondre avec une vraie session Cognito.

## 7. Conventions inter-agents

Ce repo est travaillé par plusieurs agents IA (Claude Code, Antigravity/Gemini) et des humains. Règles pour tous :

1. **Signature des commits** — chaque agent ajoute son trailer pour tracer qui a fait quoi :
   - Claude Code : `Co-Authored-By: Claude <noreply@anthropic.com>`
   - Antigravity : `Co-Authored-By: Antigravity <noreply@google.com>`
2. **Lire ce HANDOFF avant de commencer**, et le **mettre à jour en fin de session** (remplacer les sections périmées, ne pas empiler).
3. **Migrations Prisma** : ne jamais recréer ni restaurer d'anciennes migrations ; toute évolution du schéma passe par `npx prisma migrate dev --name <nom>`.
4. **Pas de reset destructif** (`migrate reset`, `db push --force-reset`, `git reset --hard`) sans accord explicite de l'utilisateur.
5. **Langue** : UI et messages d'erreur utilisateur en français ; code, identifiants et noms d'enum en anglais.
6. **Branches** : feature branches type `feature/APP/<nom>` ou `feat/<nom>`, PR vers `main`.
7. **Validation** : toute entrée API passe par un schéma Zod dans `src/schemas/`.
