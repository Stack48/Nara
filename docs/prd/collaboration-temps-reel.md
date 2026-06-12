# PRD — Collaboration Temps Réel

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Tickets Trello : 18-BE (WebSocket, Présence & Temps Réel), 33-FE (Curseurs, Présence & Conflits)
> Statut réel : **implémenté** côté serveur (Socket.io + Redis + Yjs). Tests : `src/__tests__/collaboration.test.ts`.

## 1. Introduction / Contexte

Plusieurs paroliers peuvent éditer le même projet simultanément. Il faut afficher qui est présent, synchroniser les éditions sans écrasement, et permettre la reconnexion sans perte. La convergence des éditions repose sur un CRDT (Yjs), la présence et le transport sur Socket.io, avec Redis comme adaptateur multi-instance.

## 2. Objectifs

1. Présence temps réel (qui est connecté sur quel projet).
2. Édition simultanée convergente (CRDT Yjs), sans perte ni écrasement.
3. Rooms isolées par projet.
4. Reconnexion avec récupération d'état rapide (< 1s).

## 3. User stories

- **US-1** (Léa, Marcus) : voir qui édite le projet en temps réel.
- **US-2** (Léa, Marcus) : éditer en même temps sans écraser le travail de l'autre.
- **US-3** (Romain) : observer l'activité en lecture seule.

## 4. Exigences fonctionnelles

- **EF-1** : serveur Socket.io initialisé dans `src/server/socket.server.ts` ; endpoint `src/app/api/socket/route.ts`.
- **EF-2** : gestion de présence dans `src/server/collaboration/presence.handler.ts` (entrée/sortie de room, liste des connectés).
- **EF-3** : synchronisation CRDT dans `src/server/collaboration/yjs.handler.ts` (application et diffusion des updates Yjs).
- **EF-4** : rooms par projet — un user ne reçoit que les événements de ses projets.
- **EF-5** : adaptateur Redis (`src/server/redis.client.ts`) pour le multi-instance (présence partagée entre process).
- **EF-6** : endpoint de fallback/polling `src/app/api/realtime/lyrics/route.ts`.
- **EF-7** : lock simple au départ pour limiter les conflits avant convergence complète.

## 5. Non-objectifs (hors scope)

- **PAS d'UI de curseurs/présence finalisée** : 33-FE (curseurs nommés/colorés, résolution de conflits) reste à compléter côté front.
- **PAS de persistance long terme du document Yjs** au-delà des sauvegardes lyrics classiques (17-BE gère le versionnage).

## 6. Considérations design / UX (33-FE)

- Curseurs nommés et colorés (couleur unique par user), indicateurs de présence, curseur retiré < 2s à la déconnexion, UI de résolution des divergences.

## 7. Considérations techniques

- Stack : Node.js, Socket.io, Yjs (CRDT), Redis (`REDIS_HOST`/`REDIS_PORT` dans `.env`).
- Dépend de l'infra 12-IN (ElastiCache en prod) ; en local Redis via Docker.
- Objectif latence p95 < 200ms (Trello DoD).

## 8. Métriques de succès

- Présence visible pour tous les membres connectés.
- Édition simultanée sans perte (test `collaboration.test.ts`).
- Reconnexion < 1s, latence p95 < 200ms.

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Stratégie de résolution de conflit UI (33-FE) : auto via CRDT ou intervention manuelle ? | Auto CRDT, manuel seulement sur divergence sémantique |
| Q-2 | Limite de connexions simultanées par room ? | Pas de limite dure en V1, tests de charge 100 conn. (41-QA) |
