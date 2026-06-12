# PRD — Authentification & Permissions

> 🧭 [← docs/](../README.md) · [HANDOFF](../HANDOFF.md) · [roadmap](../roadmap-trello.md)

> Tickets Trello : 13-BE (Auth Cognito), 14-BE (Rôles & Permissions), 26-FE (Auth UI), 31-FE (Permissions UI)
> Statut réel : **implémenté** (auth Cognito simulée via header — voir Non-objectifs). Tests : `src/__tests__/auth.test.ts`, `src/__tests__/rbac.test.ts`.

## 1. Introduction / Contexte

Nara est multi-utilisateurs et multi-projets : chaque projet a des membres avec des rôles distincts. Il faut identifier l'utilisateur et contrôler ce qu'il peut faire sur chaque projet. La cible prod est AWS Cognito (JWT + JWKS), mais le code actuel fonctionne avec un identifiant Cognito transmis en en-tête HTTP, ce qui débloque tout le dev back/front sans dépendre de l'infra AWS.

## 2. Objectifs

1. Identifier l'utilisateur sur chaque requête API.
2. 4 rôles hiérarchiques par projet : `ADMIN` > `LEAD_LYRICIST` > `LYRICIST` > `READONLY`.
3. Middleware d'autorisation réutilisable sur toutes les routes sensibles.
4. UI : login/inscription/profil/2FA (26-FE) et gestion membres/invitations (31-FE).

## 3. User stories

- **US-1** (tous) : me connecter pour accéder à mes projets.
- **US-2** (Admin) : gérer les rôles des membres d'un projet.
- **US-3** (Léa, Lead) : inviter un collaborateur par email et lui assigner un rôle.
- **US-4** (Romain) : recevoir un accès en lecture seule.

## 4. Exigences fonctionnelles

- **EF-1** : l'identité provient de l'en-tête `x-cognito-id` (helper `getCognitoId` dans `src/lib/rbac.ts`). Absent → 401.
- **EF-2** : hiérarchie des rôles (`src/lib/rbac.ts`) : `ADMIN=4, LEAD_LYRICIST=3, LYRICIST=2, READONLY=1`. `hasPermission(userRole, requiredRole)` = `niveau(user) >= niveau(requis)`.
- **EF-3** : `requireRole(cognitoId, projectId, requiredRole)` retourne `{ authorized, role, userId }` ; les controllers renvoient 403 si non autorisé.
- **EF-4** : à la création d'un projet, le créateur devient automatiquement membre `ADMIN`.
- **EF-5** : gestion des membres via `src/server/members/controller.ts` et routes `GET/POST /api/projects/[id]/members`, `PATCH/DELETE /api/projects/[id]/members/[memberId]`.
- **EF-6** : changement de statut d'un projet réservé à `ADMIN` ; modification du projet réservée à `LEAD_LYRICIST`+ ; suppression réservée au **propriétaire** (`ownerId`).
- **EF-7** : reset de mot de passe via `src/server/auth/password-reset.service.ts` + route `POST /api/auth/reset-password` (table `PasswordResetRequest`, token + expiration).
- **EF-8** : validation des entrées via `src/schemas/projectMember.schema.ts`, `updateRole.schema.ts`, `user.ts`.

## 5. Non-objectifs (hors scope / à finaliser)

- **PAS de vérification JWKS Cognito réelle** : l'en-tête `x-cognito-id` est posé côté front sans validation cryptographique. Le passage à la vérification JWT Cognito (13-BE complet) reste à faire pour la prod.
- **PAS de 2FA TOTP active** : prévue mais désactivée au départ (Trello 13-BE).
- **PAS de rotation de refresh token** côté Nara (déléguée à Cognito en prod).

## 6. Considérations design / UX

- Pages : `src/app/login/page.tsx`, `signin/page.tsx`, `reset-password/page.tsx`.
- UI Amplify côté client : `src/lib/amplify.ts`, hook `src/hooks/useAuth.ts`.
- Erreurs Cognito traduites : `src/lib/auth-errors.ts`.
- Tokens jamais en `localStorage` (httpOnly cookie en prod).

## 7. Considérations techniques

- Stack : Next.js route handlers, Prisma, Zod, AWS Amplify (`aws-amplify`/`amazon-cognito-identity-js`).
- Modèles : `User` (avec `cognitoId @unique`), `ProjectMember` (`@@unique([userId, projectId])`, enum `Role`), `Invitation`, `PasswordResetRequest`.
- Le middleware `src/middleware/rbac.middleware.ts` mappe les anciens rôles FR (`LEAD_PAROLIER`…) vers l'enum EN — toujours passer par lui pour le code legacy.

## 8. Métriques de succès

- Route sans `x-cognito-id` → 401 ; rôle insuffisant → 403 ; tests `auth.test.ts` + `rbac.test.ts` verts.
- Création projet → créateur `ADMIN`. Changement de rôle réservé Admin.

## 9. Questions ouvertes

| # | Question | Défaut |
|---|---|---|
| Q-1 | Quand brancher la vérification JWKS Cognito réelle (13-BE complet) ? | Avant mise en prod, après stabilisation API |
| Q-2 | 2FA TOTP : activée par défaut ou opt-in ? | Opt-in |
| Q-3 | Invitation par email : envoi réel (SES) ou lien manuel en V1 ? | Lien manuel / in-app tant que SES non configuré |
