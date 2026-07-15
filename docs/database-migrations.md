# Migrations Prisma

## État actuel

Le schéma Prisma se trouve dans `prisma/schema.prisma` et cible PostgreSQL. Il est valide avec Prisma 6.19.3.

La migration initiale `20260714154000_initial` a été générée depuis ce schéma, auditée puis appliquée sur Supabase le 14 juillet 2026. Elle constitue le point de départ de l'historique de déploiement reproductible.

## Variables de connexion

- `DATABASE_URL` : URL poolée utilisée par l'application à l'exécution.
- `DIRECT_URL` : connexion directe utilisée par Prisma Migrate et par `prisma.config.ts`.

Les deux valeurs sont des secrets serveur et ne doivent jamais porter le préfixe `VITE_`.

## Première migration versionnée

- Migration : `prisma/migrations/20260714154000_initial/migration.sql`.
- État Supabase : appliquée avec succès.
- Initialisation : 18 tables applicatives, 4 enums, leurs index et leurs clés étrangères.
- Seed RBAC : 7 rôles système, 22 permissions et leurs associations.

## Évolutions suivantes

### Sprint 2 — First Value Loop

- Migration : `prisma/migrations/20260714170000_sprint2_first_value_loop/migration.sql`.
- État Supabase : appliquée avec succès le 14 juillet 2026.
- Nature : additive et non destructive ; 6 tables, 8 enums et 2 champs d’organisation ajoutés.
- Sécurité : RLS sur les 24 tables métier, aucune policy navigateur, révocation des privilèges
  `anon` et `authenticated` sur les tables, séquences et fonctions `public`.
- Contrôle : `npm run prisma:security-check` vérifie la couverture RLS, l’absence de policies et
  l’absence de privilèges directs. `_prisma_migrations` est exclue de la couverture RLS et reste
  protégée par révocation des privilèges.

## Procédure pour les évolutions suivantes

Pour chaque modification de `schema.prisma` :

1. créer une migration nommée et ciblée avec `npm run prisma:migrate -- --name <description>` ;
2. vérifier le SQL produit et les risques de perte de données ;
3. adapter le code, le seed et les tests dans le même changement ;
4. ne jamais modifier une migration déjà partagée ;
5. déployer les migrations validées avec `npm run prisma:deploy`.

### Sprint 4 — Communication Director, Lot 1

- Migration : `prisma/migrations/20260715121004_sprint4_director_foundations/migration.sql`.
- Nature : additive et non destructive.
- Données : analyses, recommandations, préférences et retours utilisateur du Director.
- Sécurité : les quatre nouvelles tables ont RLS activé, sans policy navigateur, et leurs
  privilèges sont révoqués pour `anon` et `authenticated`.
- Activation : le feature flag `communication_director` est créé désactivé par défaut par le seed.
- Accès : Prisma demeure l’unique couche d’accès métier et chaque enregistrement porte
  `organizationId` et `workspaceId`.

### Sprint 4 — Communication Director, Lot 4

- Migration : `prisma/migrations/20260715132518_sprint4_director_api/migration.sql`.
- Ajouts : fuseau horaire des préférences, notifications Director et relation notification–recommandation.
- Concurrence : index unique partiel empêchant deux analyses `RUNNING` pour le même couple
  organisation/workspace.
- Nature : additive et non destructive ; aucune nouvelle table ni exposition navigateur.

`prisma migrate dev` est réservé au développement. Les environnements partagés et la production utilisent exclusivement `prisma migrate deploy` dans une étape de déploiement contrôlée.
