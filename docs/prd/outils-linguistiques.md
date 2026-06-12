# PRD — Outils Linguistiques (Syllabes, Rimes, Synonymes, Champs lexicaux)

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Ticket Trello : 30-FE (Outils Linguistiques — Syllabes, Rimes & Annotations)
> Statut réel : **implémenté** — API linguistique + filtres + hook front. Sources : `src/lib/lexique.ts`, `src/lib/dicolink.ts`, `src/lib/linguistic.types.ts`, `src/hooks/useLinguistic.ts`.

## 1. Introduction / Contexte

Pour enrichir l'écriture, l'éditeur propose des outils linguistiques : détection de syllabes, rimes, synonymes, antonymes, champs lexicaux, avec filtres par nombre de syllabes et catégorie grammaticale. Les données proviennent d'une base lexicale (Lexique) et de l'API externe Dicolink.

## 2. Objectifs

1. Suggestions de rimes, synonymes, antonymes, champs lexicaux pour un mot.
2. Détection du nombre de syllabes en temps réel.
3. Filtres (syllabes, catégorie) sur tous les panneaux.
4. Annotations contextuelles en marge, persistées.

## 3. User stories

- **US-1** (Léa) : trouver des rimes pour un mot en fin de vers.
- **US-2** (Léa) : filtrer les suggestions par nombre de syllabes / catégorie grammaticale.
- **US-3** (Léa) : voir le découpage syllabique en temps réel.
- **US-4** (Léa) : annoter mes intentions vocales en marge.

## 4. Exigences fonctionnelles

- **EF-1** : `GET /api/linguistic/rhymes`, `/synonyms`, `/antonyms`, `/lexical-field` — chacun accepte un mot + filtres optionnels `syllables` et `category`.
- **EF-2** : `POST /api/linguistic/add` pour enrichir la base (lien possible avec le dictionnaire communautaire 43-BE).
- **EF-3** : filtrage via `filterWordsByLexique(words, filters)` (`src/lib/lexique.ts`) → `{ results, availableSyllables, availableCategories }`, pour alimenter les dropdowns de filtres.
- **EF-4** : types partagés dans `src/lib/linguistic.types.ts` (`LinguisticResult`, `RhymeResult` avec `availableSyllables[]`, `availableCategories[]`).
- **EF-5** : appels orchestrés côté front par `src/hooks/useLinguistic.ts` (`search(word, { syllables?, category? })`).
- **EF-6** : API externe Dicolink encapsulée dans `src/lib/dicolink.ts` (clé `DICOLINK_API_KEY`).
- **EF-7** : panneau front `src/components/lyricsEditor/LyricsInspector.tsx` — un dropdown de filtres (syllabes + catégorie) par panneau.

## 5. Non-objectifs (hors scope)

- **PAS de génération assistée par IA** des paroles (pas de LLM ici, uniquement bases lexicales).
- **PAS de support multilingue** des rimes en V1 (français prioritaire).
- Refactor `LyricsInspector` (`filtersByPanel` générique) : **en cours / incomplet** — voir `docs/HANDOFF.md`.

## 6. Considérations design / UX

- Détection syllabes < 100ms, suggestions < 500ms (Trello DoD), cache local.
- Dropdowns de filtres en style « liquid glass » cohérent avec le header.
- Annotations en marge via overlays (`LineCommentOverlay`).

## 7. Considérations techniques

- Stack : Next.js, TypeScript ; base Lexique locale + API Dicolink externe.
- `DICOLINK_API_KEY` dans `.env` (clé réelle présente — **ne pas committer `.env`**).
- Cache local côté front pour éviter les appels répétés.

## 8. Métriques de succès

- Suggestions pertinentes filtrables par syllabes/catégorie sur les 4 panneaux.
- Détection syllabes < 100ms, suggestions < 500ms.
- Annotations persistées et restaurées.

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Finaliser le refactor `filtersByPanel` (call-site card encore sur anciens props) | À terminer |
| Q-2 | Quota / coût Dicolink en prod ? | À surveiller — cache agressif |
| Q-3 | Fusionner « add linguistic » avec la contribution dictionnaire (43-BE) ? | À étudier — éviter deux bases divergentes |
