.PHONY: help install dev lint build start \
	up up-build up-prod up-prod-build down ps \
	logs logs-app logs-db logs-pgadmin logs-migrate \
	exec-app exec-db exec-pgadmin \
	psql \
	db-only migrate-docker clean

COMPOSE ?= docker compose

# Services démarrés en dev (Next avec sources montées)
DEV_SERVICES := db pgadmin migrate app-dev

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z0-9_-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances npm (Prisma generate via postinstall)
	npm install

dev: ## Lance Next.js en local (penser à `make db-only` ou `make up` avant)
	npm run dev

lint: ## ESLint
	npm run lint

build: ## Build Next.js en local
	npm run build

start: ## Next.js en mode production (après build)
	npm run start

up: ## Démarre la stack dev (DB + pgAdmin + migrate + app-dev) puis logs Next.js
	$(COMPOSE) up -d $(DEV_SERVICES)
	$(COMPOSE) logs -f app-dev

up-build: ## Rebuild migrate puis démarre la stack dev, puis logs Next.js
	$(COMPOSE) up --build -d $(DEV_SERVICES)
	$(COMPOSE) logs -f app-dev

down: ## Arrête les conteneurs
	$(COMPOSE) down

logs: ## Suit les logs de tous les services du projet
	$(COMPOSE) logs -f

logs-app: ## Logs du conteneur Next.js en mode dev (app-dev)
	$(COMPOSE) logs -f app-dev

logs-db: ## Logs du conteneur PostgreSQL (db)
	$(COMPOSE) logs -f db

logs-pgadmin: ## Logs du conteneur pgAdmin
	$(COMPOSE) logs -f pgadmin

logs-migrate: ## Logs du service migrate
	$(COMPOSE) logs migrate

ps: ## État des conteneurs
	$(COMPOSE) ps -a

exec-app: ## Shell dans le conteneur Next dev (sources sous /app)
	$(COMPOSE) exec app-dev sh

exec-db: ## Ouvre un shell (sh) dans le conteneur PostgreSQL
	$(COMPOSE) exec db sh

exec-pgadmin: ## Ouvre un shell dans le conteneur pgAdmin
	$(COMPOSE) exec pgadmin sh

psql: ## Client psql interactif (utilisateur nara, base nara)
	$(COMPOSE) exec db psql -U nara -d nara

db-only: ## PostgreSQL + pgAdmin uniquement (dev local avec npm run dev)
	$(COMPOSE) up -d db pgadmin

migrate-docker: ## Applique les migrations via le service migrate
	$(COMPOSE) run --rm migrate

clean: ## Arrête la stack et supprime les volumes (données Postgres + node_modules Docker dev)
	$(COMPOSE) down -v
