# Architecture technique

## Vue d'ensemble

```text
Navigateur React
  ├── Supabase Auth (création et renouvellement de session)
  ├── Supabase Storage (opérations autorisées par politiques Storage)
  └── API Express /api (Bearer JWT Supabase)
        ├── Prisma → PostgreSQL Supabase
        ├── OpenAI (adaptateur packages/ai)
        ├── Resend
        └── Stripe (architecture préparée, non implémentée)
```

L'API Express porte toute la logique métier. Le navigateur ne lit et n'écrit jamais directement les tables métier. Prisma est l'unique couche d'accès PostgreSQL de l'application.

## Identité et multi-tenant

Supabase reste propriétaire de son schéma interne `auth`. Prisma ne l'introspecte pas et ne le migre pas. Le modèle métier `User` conserve `supabaseAuthId`, puis les adhésions relient un utilisateur à une ou plusieurs organisations.

À chaque requête protégée, l'API vérifie le JWT via le JWKS Supabase. Une couche d'autorisation vérifie ensuite l'adhésion et le rôle pour l'organisation demandée. Le frontend peut masquer une action, mais cette protection visuelle ne remplace jamais le contrôle API.

## Base de données

- `DATABASE_URL` utilise le pooler Supabase pour l'exécution de l'API.
- `DIRECT_URL` utilise la connexion directe/session pour Prisma Migrate.
- Les migrations sont produites localement par Prisma et appliquées à la base distante sans Docker.
- Les secrets ne portent jamais le préfixe `VITE_`.

## Déploiement O2Switch

Deux artefacts sont déployés : le build statique de `apps/web/dist` et l'application Node `apps/api/dist/server.js`. Le reverse proxy expose l'API sous `/api`. Les variables d'environnement sont configurées dans le panneau Node.js O2Switch, jamais commitées.

## Frontières des packages

- `packages/ui` : composants partagés stables et tokens.
- `packages/types` : contrats sans dépendance runtime métier.
- `packages/utils` : fonctions pures génériques.
- `packages/ai` : ports et adaptateurs IA, sans Express ni Prisma.
- `packages/config` : validation centralisée de l'environnement serveur.

Une feature métier reste dans son application tant qu'elle n'a pas deux consommateurs réels. Cette règle évite les abstractions prématurées.
