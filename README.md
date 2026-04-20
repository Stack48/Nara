# Nara

Boilerplate **Next.js 15** (App Router), **Prisma**, **PostgreSQL**, **Docker** (service **pgAdmin** inclus).

## Prérequis

- Docker et Docker Compose

## Démarrage (tout dans Docker)

### Développement (recommandé)

Le service **`app-dev`** monte le dépôt dans le conteneur et lance **`next dev`** (hot reload). Vous voyez tout le code sous `/app` (`make exec-app`).

```bash
make up-build    # ou : make up  si les images / volumes sont déjà prêts
```

Équivalent Compose :

```bash
docker compose up --build -d db pgadmin migrate app-dev
```

- Application : [http://localhost:3000](http://localhost:3000)
- pgAdmin : [http://localhost:5050](http://localhost:5050) (email `admin@admin.com`, mot de passe `admin`)
- PostgreSQL : `localhost:5432` (utilisateur `nara`, mot de passe `nara_secret`, base `nara`)

Dans pgAdmin, enregistrer un serveur avec l’hôte **`db`**, le port **5432**, et les identifiants ci-dessus (le réseau Docker résout le nom `db`).

Le service **`migrate`** s’exécute avant **`app-dev`**. Les dépendances npm du conteneur dev sont dans le volume nommé **`app_dev_node_modules`** (réinstallées si le volume est vide).

### Production (image Next standalone)

Ne pas lancer **`app-dev`** en même temps (même port 3000). Après un `make down` si besoin :

```bash
make up-prod-build
# ou : docker compose --profile prod up --build -d db pgadmin migrate app
```

## Développement local (Node sur la machine)

```bash
cp .env.example .env
docker compose up -d db pgadmin
npm install
npm run db:migrate   # ou db:push en prototypage
npm run dev
```

Utilisez la même `DATABASE_URL` que dans `.env.example` (`localhost` à la place de `db`).

## Scripts npm utiles

- `npm run dev` — serveur de développement Next.js
- `npm run build` — build production
- `npm run db:migrate` — migrations Prisma (dev)
- `npm run db:studio` — Prisma Studio

## Structure

- `src/app` — routes App Router (ex. CRUD `/users` : liste, création, édition)
- `src/server/users` — actions serveur + requêtes Prisma pour les utilisateurs
- `src/lib/prisma.ts` — client Prisma (singleton)
- `prisma/schema.prisma` — schéma et modèle d’exemple `User`
- `Dockerfile` — image Next (mode `standalone`) + cible `migrate`
- `docker-compose.yml` — `db`, `pgadmin`, `migrate`, `app-dev` (dev), `app` (profil `prod`)

## Bonnes pratiques — branches Git

### Nommage

- Utilisez un **préfixe** qui indique le type de travail, puis une **description courte** en **kebab-case** (minuscules, tirets).
- Forme recommandée : `<type>/<description>`.

| Préfixe | Usage |
|--------|--------|
| `feature/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `hotfix/` | Correctif urgent en production |
| `chore/` | Tâches techniques (deps, config, CI) |
| `docs/` | Documentation uniquement |
| `refactor/` | Refactor sans changement de comportement |

Exemples : `feature/user-profile`, `fix/login-redirect`, `chore/update-eslint`.

### Contenu d’une branche

- **Une branche = un sujet** : évitez de mélanger plusieurs fonctionnalités ou correctifs sans lien.
- **Nom explicite** : `fix/api-timeout` plutôt que `fix/bug` ou `update`.
- **Identifiant de ticket** (si vous en utilisez) : vous pouvez préfixer, par exemple `feature/JIRA-42-payment-webhook`.
- **Durée de vie** : rebaser ou fusionner régulièrement avec `main` pour limiter les conflits ; gardez les branches courtes si possible.

### À éviter

- Espaces, accents ou caractères spéciaux dans le nom de branche.
- Noms trop vagues (`test`, `wip`, `tmp`) sur une branche partagée ou destinée à une revue.
- Travailler directement sur `main` pour du développement non trivial (préférez une branche dédiée et une fusion par pull request).
