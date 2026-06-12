# Roadmap Nara — Board Trello complet

> 🧭 [← docs/](./README.md) · [HANDOFF](./HANDOFF.md)

> Source : export Trello `wKlY5QxO - nara.json` · Référence pour tous les agents (Claude Code, Antigravity) et le rapport de stage.
> Méthode : Agile, sprints S1→S6. Personas : **Léa** (parolière lead), **Marcus** (parolier), **Romain** (studio/audio), **Admin**.
> Statuts : ✅ Terminé · 🔄 En cours · ⬜ À faire

---

## Vue d'ensemble

| # | Ticket | Type | Sprint | Complexité | Statut | Estim. |
|---|---|---|---|---|---|---|
| 01-DS | Discovery & Cadrage | Design | S1 | Faible | ✅ | 14h |
| 02-DS | Design System & Charte Graphique | Design | S1 | Moyenne | ✅ | 21h |
| 03-DS | Wireframes & Maquettes Haute Fidélité | Design | S2 | Haute | ✅ | 35h |
| 04-DS | Prototypage & Tests Utilisateurs | Design | S2 | Moyenne | ✅ | 21h |
| 05-DS | UX Mobile, Responsive & Onboarding | Design | S3 | Moyenne | ✅ | 28h |
| 06-DS | Hub Créatif — Design | Design | S4 | Moyenne | ✅ | 21h |
| 07-IN | Docker — Environnement Local | Technique | S1 | Faible | ⬜ | 7h |
| 08-IN | Schéma DB & Migrations Prisma | Technique | S1 | Moyenne | ⬜ | 14h |
| 09-IN | AWS — Environnements & Secrets Manager | Technique | S1 | Moyenne | ⬜ | 14h |
| 10-IN | Docker — Conteneurisation & Images Prod | Technique | S2 | Moyenne | ⬜ | 10h |
| 11-IN | CI/CD — GitHub Actions → ECR → ECS | Technique | S2 | Haute | ⬜ | 21h |
| 12-IN | AWS — ECS Fargate, ALB, RDS, ElastiCache & HA | Technique | — | — | ⬜ | — |
| 13-BE | Authentification — AWS Cognito | Feature | S2 | Moyenne | 🔄 | 14h |
| 14-BE | Gestion des Rôles & Permissions | Feature | S2 | Moyenne | 🔄 | 21h |
| 15-BE | Gestion de Projets — API CRUD | Feature | S2 | Faible | 🔄 | 14h |
| 16-BE | Éditeur de Lyrics — API CRUD Lyrics & Sections | Feature | S3 | Moyenne | 🔄 | 14h |
| 17-BE | Versionnage des Lyrics | Feature | S3 | Moyenne | 🔄 | 21h |
| 18-BE | Collaboration — WebSocket, Présence & Temps Réel | Feature | S4 | Haute | 🔄 | 49h |
| 19-BE | Drive & Stockage Fichiers — AWS S3 | Feature | S3 | Moyenne | 🔄 | 14h |
| 20-BE | Sécurité — Chiffrement, Rate Limiting & RGPD | Feature | S3 | Haute | 🔄 | 35h |
| 21-BE | Smart Markers, Player Audio & Bridge.audio | Feature | S4 | Haute | 🔄 | 21h |
| 22-BE | Détection de Similarités | Feature | S4 | Haute | 🔄 | 21h |
| 23-BE | Qualité — Logs, Erreurs, Middleware & i18n | Technique | S3 | Moyenne | 🔄 | 14h |
| 24-BE | SaaS — Abonnements Stripe & API Publique | Feature | S5 | Haute | 🔄 | 49h |
| 25-FE | Setup Next.js + TypeScript + SDK Cognito | Technique | S2 | Faible | ⬜ | 7h |
| 26-FE | Auth UI — Login, Inscription, Profil & 2FA | Feature | S2 | Moyenne | 🔄 | 14h |
| 27-FE | Dashboard Projets | Feature | S3 | Faible | ✅ | 14h |
| 28-FE | Éditeur de Lyrics — TipTap, Sections & Drag & Drop | Feature | S3 | Haute | 🔄 | 21h |
| 29-FE | Interface Versionnage — Timeline & Diff | Feature | S3 | Moyenne | ⬜ | 21h |
| 30-FE | Outils Linguistiques — Syllabes, Rimes & Annotations | Feature | S4 | Haute | 🔄 | 49h |
| 31-FE | Interface Permissions & Invitations | Feature | S3 | Moyenne | 🔄 | 14h |
| 32-FE | Drive Intégré — Upload, Organisation & Aperçu | Feature | S4 | Moyenne | ✅ | 14h |
| 33-FE | Collaboration UI — Curseurs, Présence & Conflits | Feature | S4 | Haute | ⬜ | 35h |
| 34-FE | Mode Prompteur — Plein Écran & Défilement | Feature | S4 | Moyenne | ⬜ | 14h |
| 35-FE | Player Audio & Smart Markers UI | Feature | S4 | Haute | 🔄 | 21h |
| 36-FE | Détection Similarités UI & Export Lyrics | Feature | S4 | Moyenne | ⬜ | 21h |
| 37-FE | Qualité UI — Erreurs, Chargement, i18n & Accessibilité | Technique | S3 | Moyenne | ⬜ | 21h |
| 38-FE | Hub Créatif — Budget, Éducatif, Tâches & Bridge DAW | Feature | S5 | Haute | ⬜ | 70h |
| 39-FE | Application Mobile & Mode Hors-ligne | Feature | S6 | Très haute | ⬜ | 91h |
| 40-QA | Tests Unitaires Back-end (Jest) | Technique | S2 | Moyenne | 🔄 | 14h |
| 41-QA | Tests Intégration, e2e, Charge & Régression | Technique | S4 | Haute | 🔄 | 49h |
| 42-QA | Beta Test & Recueil de Feedback | Technique | S5 | Moyenne | 🔄 | 21h |
| 43-BE | Dictionnaire — API CRUD & Modération | Feature | S4 | Moyenne | ⬜* | 21h |
| 44-BE | Dictionnaire — Crawling Bases Externes | Feature | S4 | Haute | ⬜ | 28h |
| 45-FE | Dictionnaire — Interface Contribution & Recherche | Feature | S4 | Moyenne | ⬜* | 21h |
| 46-FE | Dictionnaire — Suggestion Inline dans l'Éditeur | Feature | S5 | Haute | ⬜ | 21h |
| 47-FE | Dictionnaire — Panneau Ghostwriter | Feature | S5 | Moyenne | ⬜ | 14h |
| 48-BE | Dictionnaire — Interface Admin & Validation | Feature | S4 | Faible | ⬜* | 14h |

\* 43-BE / 45-FE / 48-BE : largement entamés dans le code (voir `docs/HANDOFF.md` et `docs/prd-dictionnaire-communautaire.md`).

---

## 🎨 Design / Produit (terminé)

### 01-DS — Discovery & Cadrage — S1 · Faible · 14h
**US** : définir la vision et les bases du produit. **Inclus** : ateliers produit, 3 personas (Léa, Marcus, Romain), périmètre + KPIs, user journeys & cartographie. **DoD** : personas validés, périmètre documenté, KPIs listés et signés.

### 02-DS — Design System & Charte Graphique — S1 · Moyenne · 21h
**US** : design system cohérent. **Inclus** : moodboard & DA, palette + typo, composants UI de base, tokens de design exportés CSS/Tailwind. **DoD** : moodboard validé, composants Figma exportables, tokens CSS prêts. *Note : style sobre, pro mais accessible.*

### 03-DS — Wireframes & Maquettes Haute Fidélité — S2 · Haute · 35h · dép. 01, 02
**US** : maquettes de tous les écrans. **Inclus** : wireframes BF toutes pages, maquettes HF, responsive mobile, prototype cliquable Figma. **DoD** : toutes pages maquettées, prototype validé, handoff dev complet.

### 04-DS — Prototypage & Tests Utilisateurs — S2 · Moyenne · 21h · dép. 03
**US** : valider avec de vrais utilisateurs avant dev. **Inclus** : prototype cliquable, ≥5 sessions de tests, grille d'observation, 2 rounds d'itération. **DoD** : 5 sessions, ≥3 irritants corrigés, prototype validé avant dev.

### 05-DS — UX Mobile, Responsive & Onboarding — S3 · Moyenne · 28h · dép. 03
**US** : utiliser Nara sur mobile. **Inclus** : adaptation tablette/mobile, onboarding interactif, empty states + tooltips, PWA manifest. **DoD** : utilisable tablette 10", Lighthouse PWA ≥ 80, onboarding < 5 min.

### 06-DS — Hub Créatif — Design — S4 · Moyenne · 21h · dép. 02, 03
**US** (Léa) : modules de gestion de carrière. **Inclus** : onglets Budget, Éducatif (droits artistes, contenu vérifié juriste), Productivité (kanban). **DoD** : 3 onglets maquettés validés, cohérence DS.

---

## ⚙️ Infrastructure / DevOps

### 07-IN — Docker — Environnement Local — S1 · Faible · 7h · aucune dép.
**US** : env local en 1 commande. **Inclus** : `docker-compose.yml` (api, web, db PostgreSQL, cache Redis), volumes, hot reload. **DoD** : `docker compose up` sans erreur, tous services démarrent, hot reload OK. *Note : premier ticket — débloque tous les devs.*

### 08-IN — Schéma DB & Migrations Prisma — S1 · Moyenne · 14h · dép. 07
**US** : base versionnée et structurée. **Inclus** : entités User/Project/Lyric/Section/Role/LyricVersion/File, migrations versionnées, seeds de test, ERD documenté. **DoD** : migrations sans perte, ERD documenté, seeds < 1 min. *Note : ERD à valider avec Kenjy avant dev.*

### 09-IN — AWS — Environnements & Secrets Manager — S1 · Moyenne · 14h · dép. 07, 08
**US** : environnements AWS isolés et sécurisés. **Inclus** : 3 envs (local/staging/prod), Secrets Manager, vars injectées au runtime ECS, zéro secret commité. **DoD** : aucun secret dans le repo, accès via IAM Role, local sans accès AWS.

### 10-IN — Docker — Conteneurisation & Images Prod — S2 · Moyenne · 10h · dép. 07, 09
**US** : images Docker optimisées prod. **Inclus** : Dockerfile multi-stage node:alpine, Next.js standalone, vars via ECS Task Definition, tags SHA. **DoD** : images < 300 MB, aucun secret hardcodé, versionnées par SHA dans ECR.

### 11-IN — CI/CD — GitHub Actions → ECR → ECS — S2 · Haute · 21h · dép. 09, 10
**US** : pipeline automatisé. **Inclus** : lint → tests → build → push ECR → deploy ECS, déploiement auto staging sur push main, rollback console AWS, merge bloqué si tests rouges. **DoD** : push main → staging auto, image taguée SHA, pipeline vert.

### 12-IN — AWS — ECS Fargate, ALB, RDS, ElastiCache & HA
*(pas de description sur la carte)*

---

## 🟦 Back-end (Node.js)

### 13-BE — Authentification & Gestion de compte — AWS Cognito — S2 · Moyenne · 14h · dép. 08-IN, 09-IN · 🔄
**US** : se connecter à Nara. **Inclus** : Cognito User Pool, JWT Cognito, vérification JWKS côté back, refresh token rotation, aucun mot de passe en base Nara, 2FA TOTP activable. **DoD** : login → token valide, token expiré → 401, zéro mdp en base, tests unitaires passent.

### 14-BE — Gestion des Rôles & Permissions — S2 · Moyenne · 21h · dép. 13 · 🔄
**US** (Admin) : gérer utilisateurs, rôles, permissions. **Inclus** : 4 rôles (Admin, Lead Parolier, Parolier, Lecture seule), middleware RBAC par route, invitation email, changement/révocation de rôle. Endpoints `GET/POST/PATCH /projects/:id/members`, rôles liés à l'ID Cognito, Zod. **DoD** : chaque rôle testé unitairement, Parolier ne modifie pas directement, changement de rôle Admin only.

### 15-BE — Gestion de Projets — API CRUD — S2 · Faible · 14h · dép. 13, 14 · 🔄
**US** : accéder aux projets musicaux. **Inclus** : `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, table liée à l'ID Cognito, Zod, accès projet d'autrui → 403. **DoD** : CRUD OK, input invalide → 400, non autorisé → 403, tests passent.

### 16-BE — Éditeur de Lyrics — API CRUD Lyrics & Sections — S3 · Moyenne · 14h · dép. 15 · 🔄
**US** : écrire et structurer les lyrics. **Inclus** : `GET/POST/PATCH /projects/:id/lyrics`, stockage JSON TipTap, ordre des sections dans le JSON, suggestions soumises à validation. **DoD** : contenu sauvegardé/restauré fidèlement, sections ordonnées, suggestions visibles pour validation.

### 17-BE — Versionnage des Lyrics — S3 · Moyenne · 21h · dép. 16 · 🔄
**US** : consulter et restaurer les versions. **Inclus** : snapshot auto à chaque save, `GET /lyrics/:id/versions`, `POST /lyrics/:id/restore`, diff calculé côté API (comparaison JSON), table `LyricVersion`. **DoD** : chaque modif crée un snapshot, restauration = nouveau snapshot, diff lisible.

### 18-BE — Collaboration — WebSocket, Présence & Temps Réel — S4 · Haute · 49h · dép. 12-IN, 16 · 🔄
**US** : collaborer sur un projet. **Inclus** : Socket.io présence, adaptateur Redis multi-instance, lock simple au départ, Yjs (CRDT) édition simultanée, rooms par projet, reconnexion < 1s. **DoD** : présence visible, édition simultanée sans perte, reconnexion < 1s, latence p95 < 200ms.

### 19-BE — Drive & Stockage Fichiers — AWS S3 — S3 · Moyenne · 14h · dép. 14, 12-IN · 🔄
**US** : uploader et gérer les fichiers. **Inclus** : upload multipart S3, presigned URLs (1h), limite 50 MB + MIME whitelist, retry x3, suppression S3 sync DB. **DoD** : upload OK, >50 MB rejeté, URLs expirent, suppression synchronisée.

### 20-BE — Sécurité — Chiffrement, Rate Limiting & RGPD — S3 · Haute · 35h · dép. 13, 16 · 🔄
**US** : données protégées. **Inclus** : AES-256 des lyrics au repos (clé Secrets Manager), rate limiting 10 req/min sur /auth, Helmet + CORS, audit log des accès, consentement RGPD loggué, droit à l'oubli (cascade < 24h) + export JSON < 5 min, pentest externe + SOC 2. **DoD** : lyrics illisibles en DB, rate limiting actif, export dispo, findings pentest corrigés.

### 21-BE — Smart Markers, Player Audio & Bridge.audio — S4 · Haute · 21h · dép. 16, 19 · 🔄
**US** (Romain) : synchroniser lyrics et pistes audio. **Inclus** : marqueurs temporels liés aux sections, OAuth2 Bridge.audio, Label Copy + métadonnées (ISRC, crédits), fallback gracieux si Bridge.audio down. **DoD** : clic section → timecode ±0.5s, marqueur déplaçable, Label Copy affiché, fallback actif.

### 22-BE — Détection de Similarités — S4 · Haute · 21h · dép. 16 · 🔄
**US** : détecter les similarités avec des lyrics existants. **Inclus** : moteur n-grammes + Levenshtein, job asynchrone à la demande, résultat < 10s pour 500 mots, base de lyrics référencés. **DoD** : analyse à la demande, < 10s, score + passages retournés, job relançable.

### 23-BE — Qualité — Logs, Erreurs, Middleware & i18n — S3 · Moyenne · 14h · dép. 13 · 🔄
**US** : logs robustes et erreurs fiables. **Inclus** : middleware centralisé, format `{ error, message }`, stack trace masquée en prod, Winston JSON, Sentry sur 5xx, erreurs multilingues FR/EN/ES via Accept-Language (fallback FR). **DoD** : toute erreur catchée, pas de stack en prod, bonne langue, aucun message hardcodé.

### 24-BE — SaaS — Abonnements Stripe & API Publique — S5 · Haute · 49h · dép. 13, 14, 15 · 🔄
**US** (Admin) : gérer abonnements et facturation. **Inclus** : plans Free/Pro/Team, Stripe Billing + webhooks idempotents, portail client self-serve, API publique `/v1` à clé API, rate limit par plan → 429 + Retry-After, Swagger interactif. **DoD** : upgrade/downgrade/annulation OK, webhook idempotent, API versionnée, rate limit respecté.

### 43-BE — Dictionnaire Communautaire — API CRUD & Modération — S4 · Moyenne · 21h · dép. 13, 16
**US** : contribuer des mots, jargons et définitions de la culture musicale. **Inclus** : CRUD mots/définitions, statut not verified/verified, catégorisation (genre musical, langue/argot, région), vote upvote/downvote, validation manuelle équipe Nara, passage auto verified au seuil, historique des contributions par user. Endpoints `GET/POST /dictionary`, `PATCH /dictionary/:id/verify`, `POST /dictionary/:id/vote`. Zod, job de vérification auto sur score, audit log des validations. **DoD** : CRUD OK, mots visibles quel que soit le statut, vote OK, validation auto au seuil, disclaimer présent. *Note : les mots not verified restent visibles — disclaimer légal pour dégager la responsabilité de Nara.* → Voir `docs/prd-dictionnaire-communautaire.md`.

### 44-BE — Dictionnaire — Crawling Bases Externes — S4 · Haute · 28h · dép. 43
**US** (équipe) : enrichir automatiquement le dictionnaire. **Inclus** : Wiktionnaire (FR + argot), CNRTL (FR académique), Datamuse (EN, rimes), Free Dictionary (EN), cron job planifié, déduplication, ajout interne équipe Nara. Adaptateurs par source, normalisation, retry logic, logs de session. **DoD** : Wiktionnaire + Datamuse fonctionnels, dédup active, logs, sources taggées en DB. *Notes : prioritaire Wiktionnaire (FR) + Datamuse (EN) pour le MVP. Éviter Larousse — contenu protégé.*

### 48-BE — Dictionnaire — Interface Admin & Validation — S4 · Faible · 14h · dép. 43, 14
**US** (Admin) : modérer les contributions. **Inclus** : file de modération (mots en attente), actions valider/rejeter/modifier, notification auteur après décision, dashboard stats (total, verified, not verified, rejetés), filtres statut/catégorie/date/auteur. Endpoints `GET /admin/dictionary/pending`, `PATCH /admin/dictionary/:id`, middleware Admin only, audit log des décisions. **DoD** : file accessible, validation/rejet OK, notification envoyée, stats affichées, décisions dans l'audit log. *Note : la modération ne bloque pas la visibilité.*

---

## 🟩 Frontend (Next.js / TS)

### 25-FE — Setup Next.js + TypeScript + SDK Cognito — S2 · Faible · 7h · dép. 07-IN, 13-BE
**US** : base de code propre et typée. **Inclus** : TS strict, ESLint + Prettier, structure `/components /hooks /services /types`, SDK `amazon-cognito-identity-js`. **DoD** : build sans erreur TS, lint sans warning, structure documentée README.

### 26-FE — Auth UI — Login, Inscription, Profil & 2FA — S2 · Moyenne · 14h · dép. 25, 13-BE · 🔄
**US** : se connecter et gérer son compte. **Inclus** : formulaires inscription/connexion, reset mdp, activation 2FA, page profil. Tokens en httpOnly cookie (jamais localStorage), redirection si connecté. **DoD** : login e2e OK, tokens hors localStorage, erreurs Cognito lisibles, redirection post-login.

### 27-FE — Dashboard Projets — S3 · Faible · 14h · dép. 26, 15-BE · ✅
**US** : accéder aux projets depuis un dashboard. **Inclus** : liste avec statut/date, créer (Léa only), supprimer avec confirmation (Léa only), accès selon rôle. **DoD** : dashboard isolé par user, création/suppression selon rôle, toast sur erreur.

### 28-FE — Éditeur de Lyrics — TipTap, Sections & Drag & Drop — S3 · Haute · 21h · dép. 27, 16-BE · 🔄
**US** : écrire et structurer les lyrics. **Inclus** : TipTap nodes custom par type de section, dnd-kit drag & drop, contenu JSON, sauvegarde manuelle. **DoD** : 3 types de sections, drag & drop persisté, contenu intact après rechargement, zéro perte à la sauvegarde. *= cœur du produit.*

### 29-FE — Interface Versionnage — Timeline & Diff — S3 · Moyenne · 21h · dép. 28, 17-BE
**US** : consulter et restaurer les versions. **Inclus** : timeline (auteur, date, aperçu), diff vert/rouge, confirmation avant restauration, version restaurée = courante. **DoD** : timeline lisible, diff clair, restauration confirmée.

### 30-FE — Outils Linguistiques — Syllabes, Rimes & Annotations — S4 · Haute · 49h · dép. 28 · 🔄
**US** (Léa) : outils linguistiques pour enrichir l'écriture. **Inclus** : détection syllabes temps réel (`<ruby>`), panneau rimes/synonymes/antonymes, champs lexicaux, annotations contextuelles en marge. lexique.js + semantique.js, cache local. **DoD** : détection < 100ms, suggestions < 500ms, annotations persistées, cache local.

### 31-FE — Interface Permissions & Invitations — S3 · Moyenne · 14h · dép. 27, 14-BE · 🔄
**US** : gérer membres et permissions. **Inclus** : inviter par email, changer rôles, révoquer, visualisation. Affichage conditionnel par rôle, confirmation avant révocation. **DoD** : invitation OK, changement de rôle immédiat, non-Admin sans accès.

### 32-FE — Drive Intégré — Upload, Organisation & Aperçu — S4 · Moyenne · 14h · dép. 27, 19-BE · ✅
**US** : gérer fichiers depuis un drive intégré. **Inclus** : drag & drop (react-dropzone), organisation par projet/album, aperçu audio + PDF, niveaux d'accès. **DoD** : upload avec progression, aperçu audio, lecture seule sans bouton upload, refus → message clair.

### 33-FE — Collaboration UI — Curseurs, Présence & Conflits — S4 · Haute · 35h · dép. 28, 18-BE
**US** : collaborer en temps réel. **Inclus** : curseurs nommés/colorés (Yjs), présence (Socket.io), UI résolution de conflits. **DoD** : curseurs visibles, couleur unique/user, curseur supprimé < 2s à la déconnexion, résolution accessible.

### 34-FE — Mode Prompteur — Plein Écran & Défilement — S4 · Moyenne · 14h · dép. 28
**US** (Marcus) : prompteur en studio. **Inclus** : plein écran, défilement auto (requestAnimationFrame), vitesse 1–10 réglable live, pause/reprise, taille de police. 100% front. **DoD** : défilement sans latence, vitesse réglable, retour éditeur sans perte.

### 35-FE — Player Audio & Smart Markers UI — S4 · Haute · 21h · dép. 28, 21-BE · 🔄
**US** (Romain) : naviguer dans les lyrics via le player. **Inclus** : player HTML5, marqueurs sur timeline, clic section → timecode ±0.5s, drag des marqueurs. **DoD** : timecode correct, marqueur déplaçable, position temps réel.

### 36-FE — Détection Similarités UI & Export Lyrics — S4 · Moyenne · 21h · dép. 28, 22-BE
**US** : voir les alertes de similarité et exporter. **Inclus** : passages surlignés dans TipTap, score en panneau, signalement ignorable (masqué définitivement), export .txt/.json front (Blob + createObjectURL). **DoD** : panneau non bloquant, export sans rechargement.

### 37-FE — Qualité UI — Erreurs, Chargement, i18n & Accessibilité — S3 · Moyenne · 21h · dép. 25
**US** : interface robuste, multilingue, accessible. **Inclus** : error boundary React, toasts erreurs API, 404/500 custom, skeleton/spinner sur tous les appels, next-i18next FR/EN/ES (langue en cookie), axe-core 0 violation critique, navigation clavier. **DoD** : crash → fallback, 100% traduit, 0 violation, clavier complet.

### 38-FE — Hub Créatif — Budget, Éducatif, Tâches & Bridge DAW — S5 · Haute · 70h · dép. 27, 18-BE
**US** (Léa) : modules Hub Créatif + DAW. **Inclus** : Budget (templates avec formules, 3 scénarios), Éducatif (droits artistes), Productivité (kanban temps réel WebSocket), Bridge DAW Ableton/Logic Pro (export XML/MIDI, sections mappées aux marqueurs). **DoD** : calculs corrects, kanban temps réel, export reconnu par Ableton/Logic.

### 39-FE — Application Mobile & Mode Hors-ligne — S6 · Très haute · 91h · dép. 28, 33, 34
**US** : Nara mobile + hors-ligne. **Inclus** : app iOS/Android (React Native ou Flutter), offline avec sync + résolution de conflits, gestes natifs (swipe, pinch), prompteur mobile. **DoD** : fonctionnel iPhone 14 + Galaxy S22, offline opérationnel, sync sans perte.

### 45-FE — Dictionnaire — Interface Contribution & Recherche — S4 · Moyenne · 21h · dép. 43-BE, 25
**US** : consulter, rechercher, contribuer. **Inclus** : page dictionnaire avec recherche full-text, fiche mot (définition, catégorie, statut, source, votes), formulaire de contribution (catégorie obligatoire, Zod côté client), vote up/down avec optimistic update, badge verified (vert) / not verified (orange), disclaimer légal sur not verified, historique des contributions de l'user, pagination. **DoD** : recherche < 300ms, fiche complète, formulaire OK, vote instantané, badges, disclaimer.

### 46-FE — Dictionnaire — Suggestion Inline dans l'Éditeur — S5 · Haute · 21h · dép. 28, 43-BE, 45
**US** : l'éditeur suggère d'ajouter les mots non reconnus. **Inclus** : détection des mots inconnus pendant la saisie (extension TipTap custom, debounce 1s), bulle « Ajouter ce mot au dictionnaire Nara ? », définition au survol si mot connu, rejet définitif par mot, lien vers formulaire pré-rempli, cache local des mots vérifiés. **DoD** : bulle après 1s sur mot inconnu, rejet possible, formulaire pré-rempli, définition au survol, cache actif. *Note : ne pas perturber le flux d'écriture — bulle discrète.*

### 47-FE — Dictionnaire — Panneau Ghostwriter — S5 · Moyenne · 14h · dép. 28, 30, 43-BE
**US** : définition + usage d'un mot depuis l'éditeur. **Inclus** : sélection mot → panneau latéral enrichi, définition Nara (communautaire ou crawlée), synonymes/antonymes, statut + source, compteur d'usages dans les lyrics de la plateforme (agrégation DB), bouton « Contribuer une définition » si absent, cache sessionStorage. **DoD** : clic → panneau, définition, synonymes, compteur correct, bouton contribution.

---

## 🧪 QA / Tests

### 40-QA — Tests Unitaires Back-end (Jest) — S2 · Moyenne · 14h · dép. 13, 15, 16 · 🔄
**US** : valider les services critiques. **Inclus** : Jest sur auth/CRUD projets/CRUD lyrics/middleware erreurs, Cognito + S3 mockés, couverture ≥ 60% services/controllers, auto en CI. **DoD** : ≥ 60%, tests verts en CI, cas d'erreur couverts (token invalide, 403, 404).

### 41-QA — Tests Intégration, e2e, Charge & Régression — S4 · Haute · 49h · dép. 40, 18-BE, 28-FE · 🔄
**US** : valider flux complets et robustesse. **Inclus** : intégration par rôle (Jest), e2e staging (Playwright), charge WebSocket 100 connexions (k6/Artillery), couverture globale ≥ 80%, merge bloqué si rouge. **DoD** : ≥ 80% en CI, e2e verts staging, latence p95 < 200ms, perte < 0.1%.

### 42-QA — Beta Test & Recueil de Feedback — S5 · Moyenne · 21h · dép. 41 · 🔄
**US** : valider avec de vrais utilisateurs. **Inclus** : ≥ 20 beta testeurs, NPS, top 5 irritants corrigés avant lancement, rapport documenté, questionnaire post-session (Typeform ou équiv.). **DoD** : 20 sessions, NPS mesuré, top 5 corrigés.

---

## Stack produit (rappel)

| Couche | Techno |
|---|---|
| Front | Next.js App Router + React + TS, Tailwind, TipTap (ProseMirror), liquid glass |
| Back | Node.js, REST + Socket.io, Prisma ORM, Zod |
| Cloud AWS | Cognito (auth), S3 (fichiers), RDS + ElastiCache, ECS Fargate + ALB, Secrets Manager |
| DevOps | Docker multi-stage, GitHub Actions (lint→test→build→ECR→ECS) |
| SaaS / divers | Stripe (Free/Pro/Team), Jest, Playwright, Sentry, Winston |
