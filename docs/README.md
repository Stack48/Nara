# 📍 docs/ — Point d'entrée pour les agents

> **Tu es un agent (Claude Code, Antigravity, …) qui reprend le projet Nara ? Commence ICI.**
> Ces documents sont le canal de transfert de contexte entre agents et sessions. Le repo est la seule mémoire partagée — lis avant d'agir, mets à jour avant de partir.

## Ordre de lecture recommandé

1. **[HANDOFF.md](./HANDOFF.md)** ← **commence toujours par là.** État courant, prochaine action concrète, décisions+pourquoi, gotchas, conventions inter-agents (dont la signature des commits).
2. **[roadmap-trello.md](./roadmap-trello.md)** — vue d'ensemble : 48 tickets, sprints, DoD. ⚠️ Le board Trello d'origine est périmé ; ce fichier + les PRD reflètent l'état réel.
3. **Le PRD du domaine que tu touches** — dans [`prd/`](./prd/) (voir [son index](./prd/README.md) ou la table ci-dessous) — spec détaillée avant d'implémenter.

## Carte des documents

| Document | Domaine | Tickets | Statut réel |
|---|---|---|---|
| [HANDOFF.md](./HANDOFF.md) | **État global + conventions** | — | à jour |
| [roadmap-trello.md](./roadmap-trello.md) | **Roadmap complète** | 01→48 | référence |
| [prd/](./prd/README.md) | **Index des PRD** | — | hub |
| [prd/auth-permissions.md](./prd/auth-permissions.md) | Auth & permissions | 13/14-BE, 26/31-FE | ✅ (Cognito simulé) |
| [prd/projets-lyrics-versions.md](./prd/projets-lyrics-versions.md) | Projets, lyrics, versionnage | 15/16/17-BE, 28/29-FE | ✅ back · 🔄 éditeur |
| [prd/collaboration-temps-reel.md](./prd/collaboration-temps-reel.md) | Collaboration temps réel | 18-BE, 33-FE | ✅ serveur · 🔄 UI |
| [prd/drive-fichiers-s3.md](./prd/drive-fichiers-s3.md) | Drive & fichiers S3 | 19-BE, 32-FE | ✅ |
| [prd/securite-rgpd.md](./prd/securite-rgpd.md) | Sécurité, chiffrement, RGPD | 20-BE | ✅ |
| [prd/audio-markers.md](./prd/audio-markers.md) | Player audio, markers, Bridge.audio | 21-BE, 35-FE | ✅ back · 🔄 player |
| [prd/outils-linguistiques.md](./prd/outils-linguistiques.md) | Rimes, syllabes, synonymes | 30-FE | ✅ (refactor filtres 🔄) |
| [prd/dictionnaire-communautaire.md](./prd/dictionnaire-communautaire.md) | Dictionnaire communautaire | 43/45/46/47/48 | 🔄 en cours |
| [prd/dictionnaire-crawling.md](./prd/dictionnaire-crawling.md) | Dictionnaire — crawling bases externes | 44-BE | ✅ |

## Règles d'or (résumé — détail dans HANDOFF §7)

- **Signe tes commits** : `Co-Authored-By: Claude <noreply@anthropic.com>` ou `Co-Authored-By: Antigravity <noreply@google.com>`.
- **Migrations Prisma** : ne JAMAIS restaurer les anciennes ni `git checkout prisma/migrations`. Évolution du schéma uniquement via `npx prisma migrate dev --name <nom>`.
- **Pas de reset destructif** (`migrate reset`, `--force-reset`, `git reset --hard`) sans accord explicite de l'utilisateur.
- **Mets à jour le HANDOFF en fin de session** — remplace les sections périmées, n'empile pas.
- **Langue** : UI/erreurs en français, code/identifiants/enums en anglais.

## Arborescence

```
docs/
├── README.md          ← tu es ici (hub d'entrée)
├── HANDOFF.md         ← état + quoi faire ensuite + gotchas + conventions
├── roadmap-trello.md  ← les 48 tickets, vue d'ensemble
└── prd/
    ├── README.md      ← index des PRD
    └── *.md           ← spec détaillée par domaine (8 docs)
                          chaque PRD a une breadcrumb 🧭 vers le hub
```
