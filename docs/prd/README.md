# 📋 prd/ — Index des PRD

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

Un PRD (Product Requirements Document) par domaine fonctionnel. Chacun suit la même structure 9 sections (intro, objectifs, user stories, exigences EF-numérotées, non-objectifs, design, technique, métriques, questions ouvertes). À lire **avant d'implémenter** dans le domaine concerné.

| PRD | Domaine | Tickets | Statut réel |
|---|---|---|---|
| [auth-permissions](./auth-permissions.md) | Auth & permissions | 13/14-BE, 26/31-FE | ✅ (Cognito simulé) |
| [projets-lyrics-versions](./projets-lyrics-versions.md) | Projets, lyrics, versionnage | 15/16/17-BE, 28/29-FE | ✅ back · 🔄 éditeur |
| [collaboration-temps-reel](./collaboration-temps-reel.md) | Collaboration temps réel | 18-BE, 33-FE | ✅ serveur · 🔄 UI |
| [drive-fichiers-s3](./drive-fichiers-s3.md) | Drive & fichiers S3 | 19-BE, 32-FE | ✅ |
| [securite-rgpd](./securite-rgpd.md) | Sécurité, chiffrement, RGPD | 20-BE | ✅ |
| [audio-markers](./audio-markers.md) | Player audio, markers, Bridge.audio | 21-BE, 35-FE | ✅ back · 🔄 player |
| [outils-linguistiques](./outils-linguistiques.md) | Rimes, syllabes, synonymes | 30-FE | ✅ (refactor filtres 🔄) |
| [dictionnaire-communautaire](./dictionnaire-communautaire.md) | Dictionnaire communautaire | 43/44/45/46/47/48 | 🔄 en cours |

> Convention de nommage : `prd/<feature-name>.md` (kebab-case, sans préfixe `prd-` puisqu'on est déjà dans `prd/`). L'état de vérité reste le code + le [HANDOFF](../HANDOFF.md) ; un PRD au statut ✅ documente l'existant.
