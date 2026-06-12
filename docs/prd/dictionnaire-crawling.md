# PRD — Dictionnaire : Crawling de Bases Externes

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Ticket Trello : 44-BE · Sprint S4 · dépend de 43-BE
> Statut réel : **implémenté** — `src/server/crawl/**`, routes admin + cron, modèles Prisma dédiés. Test : `src/__tests__/crawl-normalize.test.ts`. PRD lié : [dictionnaire-communautaire](./dictionnaire-communautaire.md).

## 1. Introduction / Contexte

Le dictionnaire communautaire (43-BE) se remplit lentement via les contributions. Pour avoir un dictionnaire riche dès le départ, NARA **crawle des sources lexicales ouvertes** (APIs + datasets) et stocke les mots/relations dans une table de *staging* `DictionaryEntry`, distincte du canal communautaire `WordSuggestion`. Chaque entrée garde sa **source** et reste `not_verified` jusqu'à validation admin (48-BE).

Principe directeur (cf. guides `guide_crawling_nara_fonctionnement.md` / `guide_general_fonctionnement_crawler.md`) : **API quand elle existe, dataset quand il existe, scraping HTML en dernier recours, jamais de source propriétaire**.

## 2. Objectifs

1. Enrichir automatiquement le dictionnaire depuis des sources ouvertes (Datamuse, Free Dictionary, Wiktionnaire).
2. Stocker mots (`DictionaryEntry`) et relations seed→mot (`DictionaryRelation`) avec source traçable.
3. Déduplication robuste, normalisation, rate limiting, logs de session, gestion d'erreur non bloquante.
4. Déclenchement manuel (admin) et automatique (cron), sûr en environnement serverless.

## 3. User stories

- **US-1** (équipe) : enrichir le dictionnaire sans saisie manuelle, depuis des bases lexicales ouvertes.
- **US-2** (Léa, Marcus) : trouver rimes/mots associés crawlés depuis l'éditeur (relations normalisées des deux côtés pour matcher le lookup).
- **US-3** (Admin) : déclencher un crawl, voir les stats (par source, par log) et valider les entrées avant publication.

## 4. Exigences fonctionnelles

### Modèle de données (`prisma/schema.prisma`)
- **EF-1** : `DictionaryEntry` — `word, normalized, definition?, language, category?, partOfSpeech?, source, sourceUrl?, status` (`not_verified` par défaut), `votes`. Unicité `@@unique([normalized, language, source])` + index sur `normalized/language/source/status`.
- **EF-2** : `DictionaryRelation` — `sourceWord, targetWord, relation` (`rhyme | related | synonym | antonym | translation`), `language, source, score?`. Unicité `@@unique([sourceWord, targetWord, relation, language, source])`.
- **EF-3** : `CrawlLog` (`source, status, inserted, skipped, failed, message?, startedAt, endedAt?`) et `CrawlError` (`source, word?, message, payload?`).
- **EF-4** : `DictionaryEntry` est **séparé de `WordSuggestion`** — staging multi-source vs canal communautaire (`word @unique` global). Ne pas fusionner.

### Crawlers (`src/server/crawl/crawlers/`)
- **EF-5** : `datamuse.crawler.ts` — `crawlDatamuseRhymes` (rimes EN) + `crawlDatamuseRelated` (mots associés EN), retourne `{ entries, relations }`.
- **EF-6** : `free-dictionary.crawler.ts` — `crawlFreeDictionary` (définitions/phonétique/partOfSpeech EN).
- **EF-7** : `wiktionary.crawler.ts` — `crawlWiktionary` (extrait FR via API MediaWiki TextExtracts).
- **EF-8** : tous les fetch passent par `utils/safe-fetch.ts` → `safeFetchJson` : User-Agent `NARA-Dictionary-Crawler/1.0`, `cache: no-store`, **retourne `null` sur toute erreur** (réseau, HTTP non-2xx, JSON invalide) — un mot raté ne stoppe jamais le job.

### Service d'insertion (`src/server/crawl/crawl.service.ts`)
- **EF-9** : `insertDictionaryEntries` / `insertDictionaryRelations` — normalisation via `normalizeWord` (rejette < 2 caractères), **dédup déléguée à PostgreSQL** via `createMany({ skipDuplicates: true })` (1 requête, pas de `findUnique`+`create` par mot). Option `dryRun`. Erreur → `CrawlError`, `failed` incrémenté, job continue.

### Job & orchestration (`src/server/crawl/crawl.job.ts`)
- **EF-10** : `runDictionaryCrawlJob({ dryRun?, maxSeeds? })`. `MAX_SEEDS_PER_RUN = 20` (limite serverless Vercel).
- **EF-11** : **seeds = mots communautaires approuvés** (`WordSuggestion` `status=APPROVED`, plus récents d'abord), répartis FR/EN ; sinon listes fallback (`amour, flow, punchline…` / `love, flow, rhythm…`). Budget moitié EN / moitié FR.
- **EF-12** : rate limiting — `sleep(500)` entre seeds EN (Datamuse), `sleep(700)` entre seeds FR (Wiktionnaire).
- **EF-13** : `CrawlLog` créé en `running` → mis à jour `success` / `partial` (si `failed>0`) / `failed` (exception), avec compteurs et `message`.

### Routes (App Router)
- **EF-14** : `POST /api/admin/dictionary/crawl` (admin) déclenche le job ; param `?dryRun=true`. `GET` même route = dashboard (logs, `totalEntries`, répartition `bySource`, 30 dernières entrées).
- **EF-15** : `GET /api/cron/dictionary-crawl` protégé par `Authorization: Bearer ${CRON_SECRET}` ; planifiable via `vercel.json` (`schedule: "0 3 * * *"`).
- **EF-16** : `GET /api/dictionary/crawled` expose les entrées crawlées.

## 5. Non-objectifs (hors scope / non implémenté)

- **PAS de scraping HTML** ni de navigateur headless : uniquement APIs/JSON. Donc `robots.txt` n'est pas parsé (sans objet pour des APIs publiques documentées) — à ajouter si une future source nécessite du HTML.
- **PAS de retry / exponential backoff** : `safeFetchJson` renvoie `null` sans réessayer. Acceptable pour un crawl best-effort relançable ; à renforcer si taux d'échec élevé.
- **PAS d'import des datasets lourds** (Lexique.org, DBnary RDF, ConceptNet, Open Multilingual Wordnet, WOLF, Wikidata Lexemes) — V1+ ; nécessite un import offline, pas une route Next.js.
- **PAS de file/worker distribué** (BullMQ, Inngest, ECS scheduled task) : un seul run synchrone borné à 20 seeds. À introduire si le volume grossit.
- **Sources propriétaires interdites** : Larousse, Le Robert, Reverso, WordReference, Cambridge, Oxford, Merriam-Webster, Rimes.fr, etc.

## 6. Considérations design / UX (admin)

- Page `src/app/(main)/admin/crawl` : bouton « lancer le crawl » (+ dry-run), tableau des `CrawlLog`, compteurs par source, dernières entrées. Validation des entrées `not_verified` relève de la modération (48-BE).

## 7. Considérations techniques

- Stack : Node.js (runtime `nodejs`, `dynamic = force-dynamic`), Prisma, PostgreSQL, fetch natif.
- **Variables d'env** : `CRON_SECRET` (obligatoire pour la route cron, sinon 401). Pas de clé pour Datamuse/Free Dictionary/Wiktionnaire (sources ouvertes).
- **Limite serverless** : ne jamais dépasser `MAX_SEEDS_PER_RUN` par exécution ; le cron quotidien étale la charge.
- Lien éditeur : `DictionaryRelation` stocke des mots **normalisés des deux côtés** pour que le lookup depuis le lyrics-editor (rimes/synonymes) matche.
- Auth admin actuelle = check en dur (`email === "lea@nara.com"`) — provisoire, à brancher sur le vrai RBAC (14-BE) une fois Cognito réel (cf. [auth-permissions](./auth-permissions.md)).

## 8. Métriques de succès

- Crawl Datamuse + Wiktionnaire fonctionnel, dédup active, sources taggées en DB, logs de session écrits (cf. `crawl-normalize.test.ts`).
- Un mot/source en erreur n'arrête pas le job (`failed` compté, statut `partial`).
- Job relançable sans casser la DB (idempotent via `skipDuplicates`).
- Les entrées restent `not_verified` jusqu'à validation admin.

## 9. Questions ouvertes

| # | Question | Défaut / piste |
|---|---|---|
| Q-1 | Le commentaire du job parle d'un « curseur (CrawlState) » pour reprendre où le run précédent s'est arrêté, mais `getSeeds` prend toujours les derniers `APPROVED` sans offset → pas de vraie pagination. Ajouter un curseur ? | À implémenter si on veut couvrir tout le backlog de seeds, pas juste les 20 plus récents |
| Q-2 | Brancher l'auth admin sur le RBAC réel (rôle `ADMIN`) au lieu du check email en dur | Après 13-BE Cognito réel |
| Q-3 | Quand importer les datasets (Lexique.org pour syllabes FR, DBnary) ? | Après MVP, en script offline `src/server/crawl/scripts/` |
| Q-4 | Ajouter ConceptNet / WordNet pour les champs lexicaux ? | Priorité moyenne, après stabilisation |
| Q-5 | Pont `DictionaryEntry` → `WordSuggestion` : promouvoir une entrée crawlée verified vers le canal communautaire ? | À définir avec 48-BE |
