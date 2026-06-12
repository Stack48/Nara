# PRD — Dictionnaire Communautaire Nara

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Tickets Trello : 43-BE, 44-BE, 45-FE, 46-FE, 47-FE, 48-BE · Sprints S4–S5
> Statut : en cours d'implémentation (back-end largement entamé, voir `docs/HANDOFF.md`)

## 1. Introduction / Contexte

Nara est une plateforme collaborative d'écriture de paroles (Next.js 15 App Router + React 19 + Prisma + PostgreSQL). Les paroliers utilisent du vocabulaire issu de la culture musicale (argot, verlan, régionalismes, jargon de genre musical) que les dictionnaires classiques ne couvrent pas.

Le **dictionnaire communautaire** permet aux utilisateurs de contribuer des mots et définitions, de voter dessus, et à l'équipe Nara de modérer les contributions. Il alimente ensuite l'éditeur de paroles (suggestions inline, panneau ghostwriter).

**Personas** : Léa (parolière lead), Marcus (parolier), Admin (équipe Nara).

## 2. Objectifs

1. Permettre à tout utilisateur connecté de soumettre un mot + définition (43-BE)
2. Système de vote communautaire (+1/−1) avec passage automatique en "verified" au-delà d'un seuil (43-BE)
3. Modération admin : valider, rejeter, modifier les contributions en attente (48-BE)
4. Page publique de consultation/recherche du dictionnaire (45-FE)
5. À terme : enrichissement automatique par crawling de bases externes (44-BE) et intégration dans l'éditeur (46-FE, 47-FE)

## 3. User stories

- **US-1** (Léa, Marcus) : en tant que parolier, je veux contribuer au dictionnaire Nara en ajoutant des mots, jargons et définitions issus de la culture musicale.
- **US-2** (Léa, Marcus) : en tant que parolier, je veux consulter et rechercher dans le dictionnaire (full-text), voir le statut d'un mot (verified / not verified), sa catégorie et ses votes.
- **US-3** (Léa, Marcus) : en tant que parolier, je veux voter pour/contre un mot existant pour signaler sa pertinence.
- **US-4** (Admin) : en tant qu'admin, je veux une file de modération des mots en attente, avec actions valider / rejeter / modifier avant validation.
- **US-5** (Admin) : en tant qu'admin, je veux un tableau de bord des contributions (totaux par statut, filtres par statut/catégorie/date/auteur).

## 4. Exigences fonctionnelles

### API publique (43-BE)

- **EF-1** : `GET /api/dictionary` retourne la liste paginée des mots, avec filtres `status`, `category`, `search` (recherche insensible à la casse sur mot, description, synonymes).
- **EF-2** : `POST /api/dictionary` crée un mot (auth requise). Champs : `word` (unique), `description` (requis), `synonyms`, `antonyms`, `category` (`genre_musical` | `argot` | `geographie` | `standard`), `language`. Statut initial : `PENDING`.
- **EF-3** : `GET /api/dictionary/[id]` retourne la fiche d'un mot avec auteur, votes (somme), statut.
- **EF-4** : `PUT /api/dictionary/[id]` modifie un mot — autorisé à l'auteur du mot ou à un admin.
- **EF-5** : `POST /api/dictionary/[id]/vote` enregistre un vote `+1` ou `−1`. Un seul vote par utilisateur et par mot (revoter remplace le vote précédent).
- **EF-6** : passage automatique `PENDING` → vérifié quand la somme des votes atteint le seuil (défaut : **10** — voir Questions ouvertes).

### API admin (48-BE)

- **EF-7** : `GET /api/admin/dictionary` retourne la file de modération (mots `PENDING`), paginée, filtres statut/catégorie/date/auteur. Accès réservé rôle `ADMIN`.
- **EF-8** : `PUT /api/admin/dictionary/[id]` permet valider (`APPROVED` + `isVerifiedByNara=true`), rejeter (`REJECTED`), ou modifier-puis-valider un mot.
- **EF-9** : `GET /api/admin/dictionary/stats` retourne les stats : total, verified, not verified, rejetés, répartition par catégorie.
- **EF-10** : toute route admin vérifie le rôle via le middleware RBAC (`src/middleware/rbac.middleware.ts`) — un non-admin reçoit 403.

### Validation

- **EF-11** : toutes les entrées sont validées côté serveur avec les schémas Zod de `src/schemas/dictionary.schema.ts`. Erreur 400 avec message en français si invalide.

## 5. Non-objectifs (hors scope de cette itération)

- **PAS de crawling externe ici** (Wiktionnaire, Datamuse, Free Dictionary) — c'est le ticket 44-BE, traité séparément et **déjà implémenté** : voir [dictionnaire-crawling](./dictionnaire-crawling.md). Note : les données crawlées vivent dans `DictionaryEntry` (staging multi-source), distinct de `WordSuggestion` (canal communautaire) — ne pas confondre les deux.
- **PAS de notification email** à l'auteur après décision de modération — dépend de 13-BE (Cognito). En V1 : simple mise à jour du statut visible dans l'UI.
- **PAS de suggestion inline dans l'éditeur** (46-FE) ni de panneau ghostwriter (47-FE) — sprints S5, après stabilisation de l'API.
- **PAS d'auth Cognito réelle** : tant que 13-BE n'est pas livré, l'identité passe par un `cognitoId` simulé (voir `getOrCreateUser` dans `src/server/dictionary/controller.ts`).

## 6. Considérations design / UX

- UI suit le design system "liquid glass" du projet (backdrop-blur, composants existants dans `src/components/`).
- Badge visuel `verified` / `not verified` sur chaque fiche mot.
- Disclaimer légal affiché sur les mots `not verified` (contenu communautaire non validé).
- Composants existants : `src/components/dictionary/WordCard.tsx`, `SuggestWordModal.tsx`, `EditModerationModal.tsx`.

## 7. Considérations techniques

- **Stack** : Next.js App Router (route handlers `src/app/api/`), Prisma 6.19.3, PostgreSQL 16 (Docker local), Zod pour la validation.
- **Modèles Prisma** (`prisma/schema.prisma`) : `WordSuggestion` (étendu avec `category`, `language`, `authorId`, relation `votes`) et `WordVote` (contrainte `@@unique([wordId, userId])` = 1 vote/user). Migration appliquée : `20260611095811_extend_word_suggestion`.
- **Logique métier** centralisée dans `src/server/dictionary/controller.ts` (pattern controller), les route handlers restent minces.
- **RBAC** : `src/middleware/rbac.middleware.ts` mappe les anciens rôles français (`LEAD_PAROLIER`…) vers les rôles anglais de l'enum `Role` (`LEAD_LYRICIST`…). Toujours passer par ce mapping.
- **Dépendances tickets** : 43-BE dépend de 13-BE (auth) et 16-BE (CRUD lyrics) ; 48-BE dépend de 43-BE et 14-BE (rôles). Les dépendances auth sont contournées temporairement (cf. Non-objectifs).

## 8. Métriques de succès

- Toutes les routes EF-1 → EF-11 répondent correctement (tests manuels ou Jest).
- Un parolier peut soumettre un mot, le retrouver via la recherche, et voter — sans erreur 500.
- Un admin voit la file de modération et peut valider/rejeter ; un non-admin reçoit 403.
- Le seuil de votes déclenche bien le passage automatique en verified.

## 9. Questions ouvertes

| # | Question | Défaut si pas de réponse |
|---|---|---|
| Q-1 | Seuil de votes pour passage auto en verified ? | 10 |
| Q-2 | Un vote négatif net (somme < 0) doit-il déclasser/cacher un mot ? | Non — reste PENDING, visible avec badge |
| Q-3 | La notification à l'auteur (48-BE) : in-app via WebSocket (18-BE) ou email ? | Reportée — hors V1 |
| Q-4 | Les mots `REJECTED` restent-ils en base (audit) ou sont supprimés ? | Conservés en base, exclus des listes publiques |
