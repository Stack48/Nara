# PRD — Player Audio, Smart Markers & Bridge.audio

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Tickets Trello : 21-BE (Smart Markers, Player Audio & Bridge.audio), 35-FE (Player Audio & Smart Markers UI)
> Statut réel : **implémenté** côté back (`bridge-audio.service.ts`, routes markers + label-copy). Tests : `src/app/__tests__/audio-markers.test.ts`. Player front 35-FE en cours.

## 1. Introduction / Contexte

En studio, Romain navigue dans les lyrics via une piste audio. Des marqueurs temporels relient chaque section au bon timecode. Les métadonnées de release (ISRC, crédits, label) proviennent de Bridge.audio via OAuth2, avec un fallback gracieux si le service est indisponible.

## 2. Objectifs

1. Marqueurs temporels liés aux sections d'un projet.
2. Player audio HTML5 avec navigation par section (clic → timecode).
3. Intégration Bridge.audio (métadonnées Label Copy) + fallback.

## 3. User stories

- **US-1** (Romain) : cliquer sur une section pour lancer la lecture au bon timecode (± 0,5s).
- **US-2** (Romain) : déplacer un marqueur sur la timeline.
- **US-3** (Léa) : voir les métadonnées Label Copy (ISRC, crédits) du titre.

## 4. Exigences fonctionnelles

- **EF-1** : CRUD marqueurs — `GET/POST /api/projects/[id]/markers`, `PATCH/DELETE /api/projects/[id]/markers/[markerId]`.
- **EF-2** : modèle `AudioMarker` (`timecode Float, label?, lyricsId, fileId, createdBy`) lié à `Lyrics` et `File`.
- **EF-3** : Label Copy — `GET/POST /api/projects/[id]/label-copy` (modèle `LabelCopy` : `title, isrc?, composers[], publishers[], recordLabel?, releaseDate?, bridgeAudioId?`).
- **EF-4** : intégration Bridge.audio dans `src/server/bridge-audio.service.ts` — OAuth2 `client_credentials`, token en mémoire avec expiration, `getBridgeTrackMetadata`, `syncLabelCopy` (upsert).
- **EF-5** : **fallback gracieux** — si `BRIDGE_AUDIO_CLIENT_ID/SECRET` absents ou API en erreur, retour `{ fallback: true, message }` sans planter ; métadonnées locales utilisées.
- **EF-6** : clic section → timecode précis à ± 0,5s ; marqueurs déplaçables (drag).

## 5. Non-objectifs (hors scope)

- **PAS de transcodage audio** côté Nara (lecture du fichier S3 tel quel).
- **PAS d'analyse de waveform** serveur (le rendu timeline est front).
- Le player front complet (35-FE) et son UI de markers restent à finaliser.

## 6. Considérations design / UX (35-FE)

- Player HTML5 avec contrôles, marqueurs sur la timeline, position mise à jour en temps réel, drag des marqueurs. Hit-zone des marqueurs resserrée + création par clic droit (cf. `docs/HANDOFF.md`).
- Composant : `src/components/LyricsEditor/TrackPlayer.tsx`.

## 7. Considérations techniques

- Stack : Node.js, PostgreSQL/Prisma, AWS S3 (source audio), Bridge.audio (OAuth2).
- Variables : `BRIDGE_AUDIO_CLIENT_ID`, `BRIDGE_AUDIO_CLIENT_SECRET` (absentes → mode fallback automatique).
- Dépend de 16-BE (lyrics/sections) et 19-BE (fichiers S3).

## 8. Métriques de succès

- Clic section → timecode correct (± 0,5s) ; marqueur déplaçable ; Label Copy affiché ; fallback actif quand Bridge.audio indisponible (test `audio-markers.test.ts`).

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Token Bridge.audio en mémoire process : OK en multi-instance ? | Acceptable en V1 ; cache Redis si multi-instance |
| Q-2 | Mapping exact champs Bridge.audio → LabelCopy | Selon réponse API réelle (`title`, `isrc`, `composers`, `publishers`, `record_label`) |
