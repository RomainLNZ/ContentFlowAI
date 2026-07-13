# Migrations Prisma

## État actuel

Le schéma Prisma se trouve dans `prisma/schema.prisma` et cible PostgreSQL. Il est valide avec Prisma 6.19.3. Au moment de cette stabilisation, aucune migration versionnée n'est présente dans `prisma/migrations` : le schéma décrit donc le modèle attendu, mais ne constitue pas à lui seul un historique de déploiement reproductible.

La création d'une migration initiale nécessite une base PostgreSQL de développement accessible via `DIRECT_URL`. Elle ne doit pas être générée contre la base de production sans revue préalable.

## Variables de connexion

- `DATABASE_URL` : URL poolée utilisée par l'application à l'exécution.
- `DIRECT_URL` : connexion directe utilisée par Prisma Migrate et par `prisma.config.ts`.

Les deux valeurs sont des secrets serveur et ne doivent jamais porter le préfixe `VITE_`.

## Première migration versionnée

Après avoir configuré une base de développement vide ou dédiée :

```bash
npm run prisma:generate
npm run prisma:migrate -- --name initial
npm run prisma:seed
```

Cette commande doit créer `prisma/migrations/<timestamp>_initial/migration.sql` et `prisma/migrations/migration_lock.toml`. Relire le SQL avant de versionner la migration, puis exécuter les tests concernés.

## Évolutions suivantes

Pour chaque modification de `schema.prisma` :

1. créer une migration nommée et ciblée avec `npm run prisma:migrate -- --name <description>` ;
2. vérifier le SQL produit et les risques de perte de données ;
3. adapter le code, le seed et les tests dans le même changement ;
4. ne jamais modifier une migration déjà partagée ;
5. déployer les migrations validées avec `npm run prisma:deploy`.

`prisma migrate dev` est réservé au développement. Les environnements partagés et la production utilisent exclusivement `prisma migrate deploy` dans une étape de déploiement contrôlée.
