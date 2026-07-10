# Conventions de développement

## Nommage

- Dossiers et fichiers : `kebab-case` (`organization-service.ts`).
- Composants et types : `PascalCase` (`OrganizationSwitcher`).
- Fonctions et variables : `camelCase` (`findActiveMembership`).
- Constantes globales : `SCREAMING_SNAKE_CASE`.
- Tables SQL : `snake_case`, modèles Prisma : `PascalCase`.
- Routes HTTP : noms pluriels en kebab-case (`/api/organizations/:organizationId/members`).
- Codes d'erreur : `SCREAMING_SNAKE_CASE` et stables publiquement.

## API

Les routes valident entrée, paramètres et sortie avec Zod. Elles délèguent la logique aux services ; elles ne contiennent ni requête Prisma complexe ni appel fournisseur. Les erreurs attendues utilisent `HttpError` et ne divulguent jamais une erreur interne.

Chaque requête métier protégée suit l'ordre : authentification, résolution de l'utilisateur applicatif, autorisation tenant, validation, service, réponse.

## Git et migrations

Les commits suivent Conventional Commits. Une migration Prisma est immuable après partage. Chaque changement de schéma contient la migration, l'adaptation du code et les tests concernés.

## Tests

- Unitaires : règles métier et fonctions pures.
- Intégration : routes Express avec dépendances contrôlées.
- Base de données : migrations sur une base PostgreSQL de test dédiée.
- E2E : parcours commerciaux critiques, ajoutés à partir du Sprint 1.
