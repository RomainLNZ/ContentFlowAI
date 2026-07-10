# CommunicationOS AI

> L'intelligence artificielle qui pilote votre communication.

Socle du SaaS B2B multi-tenant construit avec React/Vite, Express, Prisma et PostgreSQL Supabase.

## Prérequis

- Node.js 22+
- Une base PostgreSQL Supabase accessible

## Démarrage local

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name initial
npm run prisma:seed
```

Copiez `.env.example` vers `.env`, puis renseignez les URLs PostgreSQL et les clés du projet Supabase distant.

```bash
npm run dev
```

Le frontend est accessible sur `http://localhost:5173` et l'API sur `http://localhost:3001/api/health`.

## Qualité

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

La commande `npm run check` exécute toute la chaîne.

## Structure

- `apps/web` : application React Feature First
- `apps/api` : API Express et logique métier
- `packages` : contrats et briques transverses
- `prisma` : schéma et migrations PostgreSQL
- `docs/architecture.md` : décisions et règles d'évolution
- `docs/design-system.md` : tokens et composants partagés

## Sécurité

Les JWT sont émis par Supabase Auth puis vérifiés par l'API. Les autorisations multi-tenant sont imposées par les services Express. Les secrets OpenAI, Resend, Stripe et la clé Supabase de service restent exclusivement côté API.
