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

L'état du schéma et la procédure opérationnelle sont détaillés dans [`docs/database-migrations.md`](./database-migrations.md).

## Déploiement O2Switch

Deux artefacts sont déployés : le build statique de `apps/web/dist` et l'application Node `apps/api/dist/server.js`. Le reverse proxy expose l'API sous `/api`. Les variables d'environnement sont configurées dans le panneau Node.js O2Switch, jamais commitées.

## Frontières des packages

- `packages/ui` : composants partagés stables et tokens.
- `packages/types` : contrats sans dépendance runtime métier.
- `packages/utils` : fonctions pures génériques.
- `packages/ai` : ports et adaptateurs IA, sans Express ni Prisma.
- `packages/events` : contrats d’événements et Event Bus indépendant du transport.
- `packages/config` : validation centralisée de l'environnement serveur.

Une feature métier reste dans son application tant qu'elle n'a pas deux consommateurs réels. Cette règle évite les abstractions prématurées.

Le détail du noyau IA, de son pipeline et de ses extensions est documenté dans [`docs/ai-core.md`](./ai-core.md).

## Hiérarchie multi-tenant

```text
Organization
└── Workspace
    └── Team
        └── Users via memberships
```

Un utilisateur peut appartenir à plusieurs organisations, workspaces et équipes. Chaque niveau possède une table d’adhésion propre afin d’éviter des colonnes polymorphes fragiles. Les workspaces isolent les marques, filiales ou unités éditoriales ; les teams organisent les collaborateurs.

## Autorisation dynamique

Les rôles et permissions sont des données, pas des enums applicatifs. `AccessControlService` agrège les permissions de plateforme, organisation, workspace et équipe. Ajouter une permission ou un rôle personnalisé ne nécessite pas de modifier ce service.

Le seed idempotent installe `SUPER_ADMIN`, `OWNER`, `ADMIN`, `MANAGER`, `EDITOR`, `AUTHOR` et `VIEWER`. Les rôles système ne peuvent pas être renommés par le produit ; des rôles personnalisés peuvent être rattachés à une organisation.

## Événements et automatisations

`@flowpilot/events` expose un Event Bus et une implémentation mémoire. Les producteurs publient des événements métier sans connaître les consommateurs. La table `outbox_events` permet une publication fiable après transaction ; un worker PostgreSQL sera ajouté lorsqu’un premier traitement asynchrone le justifiera.

Les événements portent systématiquement un `correlationId`, un agrégat et, si disponible, l’organisation et l’acteur. Ils sont versionnés par leur nom lors des futures ruptures de payload.

## Feature Flags

Les flags sont stockés en base. La décision suit cet ordre : dérogation temporaire d’organisation, droit du plan commercial, valeur par défaut. La configuration JSON permet d’associer quotas ou paramètres à un flag sans nouveau schéma.

Les flags sécurisent l’accès côté API ; leur usage dans React sert uniquement à adapter l’interface.
