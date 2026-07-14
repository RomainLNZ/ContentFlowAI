# Sprint 2 — First Value Loop

## Lot 1 — Sécurité et données

- Migration : `20260714170000_sprint2_first_value_loop`.
- Schéma : nouveaux modèles d’onboarding, profil de marque, objectifs, générations IA,
  variantes et contenus ; ajout de `country_code` et `primary_language` aux organisations.
- Sécurité : RLS activée sur les 24 tables métier, aucune policy navigateur, révocation des
  privilèges directs de `anon` et `authenticated` sur les tables, séquences et fonctions de
  `public`, y compris `_prisma_migrations` pour les privilèges uniquement.
- Contrôle reproductible : `npm run prisma:security-check`.
- Validation : migration additive auditée, appliquée avec succès, schéma distant à jour,
  Prisma Client régénéré, typecheck réussi et Supabase Auth health `200 OK`.

Fichiers créés ou modifiés :

- `prisma/schema.prisma`
- `prisma/migrations/20260714170000_sprint2_first_value_loop/migration.sql`
- `scripts/verify-database-security.ts`
- `package.json`
- `docs/sprint-2.md`

Action manuelle : aucune pour ce lot.

## Lot 2 — Authentification et tenant

- Authentification Supabase réelle uniquement, restauration de session et callback PKCE explicite.
- Synchronisation idempotente de l’utilisateur Supabase vers Prisma.
- Séparation de `supabaseAuthId` et de l’identifiant Prisma `User.id`.
- Résolution typée du contexte applicatif ; les headers tenant sont validés contre les adhésions
  actives et l’appartenance réelle du workspace à l’organisation.
- RBAC corrigé pour empêcher qu’un workspace ou une équipe d’une autre organisation ne contribue
  des permissions.
- Route ajoutée : `GET /api/v1/me`.

Fichiers principaux créés ou modifiés : `apps/api/src/middleware/*`,
`apps/api/src/modules/users/*`, `apps/api/src/modules/access-control/*`,
`apps/api/src/routes/me.route.ts`, `apps/web/src/features/auth/*`,
`apps/web/src/app/application-context.tsx` et `apps/web/src/lib/api-client.ts`.

Action manuelle : conserver dans Supabase les URLs de redirection vers `/auth/callback` et
`/reset-password` pour chaque environnement déployé.

## Lot 3 — Onboarding

- Progression et brouillon sauvegardés côté API, avec reprise après interruption.
- Finalisation transactionnelle, sérialisable et idempotente.
- Création de l’organisation, du workspace principal, du `BrandProfile`, des objectifs, et des
  adhésions OWNER organisation/workspace dans une transaction unique.
- Routes : `GET /api/v1/onboarding`, `PUT /api/v1/onboarding`,
  `POST /api/v1/onboarding/complete`.
- Page ajoutée : `/onboarding`, protégée par Supabase Auth et reprise depuis le serveur.

Fichiers principaux créés ou modifiés : `apps/api/src/modules/onboarding/*`,
`apps/api/src/routes/onboarding.route.ts`, `apps/web/src/features/onboarding/*` et le routeur web.

Action manuelle : aucune.

## Lot 4 — IA

- Adaptateur `OpenAiProvider` conforme à `AiProvider`, basé sur l’API Responses et chargé
  exclusivement côté serveur.
- `SocialContentAgent` LinkedIn et prompt versionné `social.linkedin@1`.
- Sortie structurée JSON Schema, puis validation stricte Zod de trois variantes.
- Mémoire d’entreprise assemblée depuis l’organisation, le `BrandProfile` et les objectifs du
  tenant résolu.
- Guardrails de taille, injection de prompt et mots interdits ; télémétrie persistée dans
  `ai_generations` ; gestion distincte des indisponibilités, timeouts, refus et sorties invalides.
- Route : `GET /api/v1/ai/status` et `POST /api/v1/ai/generate/linkedin`.
- Sans `OPENAI_API_KEY`, le serveur démarre normalement et l’interface présente un message de
  configuration sans bloquer les autres fonctionnalités.

Fichiers principaux créés ou modifiés : `packages/ai/src/providers/openai.provider.ts`,
`packages/ai/src/agents/social-content-agent.ts`, `packages/ai/src/guardrails/*`,
`packages/ai/prompts/catalog/social/linkedin/v1.json`, `apps/api/src/modules/ai/*` et
`apps/api/src/routes/ai.route.ts`.

Action manuelle : renseigner `OPENAI_API_KEY` côté API pour activer la génération réelle.

## Lot 5 — Contenus

- API tenant-scopée de création, liste paginée, recherche, filtres, consultation, modification,
  duplication et archivage des contenus.
- Vérification tenant de la variante source avant création d’un brouillon.
- Routes : `GET/POST /api/v1/content`, `GET/PUT /api/v1/content/:id`,
  `POST /api/v1/content/:id/duplicate`, `POST /api/v1/content/:id/archive`,
  `GET/PUT /api/v1/brand-profile`.
- Pages : `/app/create`, `/app/content`, `/app/content/:id`, plus un nouvel accueil applicatif.

Fichiers principaux créés ou modifiés : `apps/api/src/modules/content/*`,
`apps/api/src/routes/content.route.ts`, `apps/api/src/routes/brand-profile.route.ts`,
`apps/web/src/features/content/*`, `apps/web/src/components/app-shell.tsx` et le routeur web.

Action manuelle : aucune.

## Lot 6 — Validation finale

- `format:check`, lint, typecheck, tests et build : réussis.
- Tests : 25 réussis (API 11, web 4, AI Core 7, events 2, UI 1), sans appel OpenAI réel.
- Audit npm : 0 vulnérabilité.
- Audit SQL distant : 24 tables métier avec RLS, 0 policy publique et 0 privilège direct pour
  `anon`/`authenticated` ; migration distante à jour.
- Supabase Auth : endpoint de santé `200 OK` après les révocations.
- Démarrage API compilée et endpoint `/api/health` : vérifiés.
- Secrets : `.env` non suivi, aucune variable serveur `VITE_*` et aucun secret serveur détecté
  dans les sources ou le bundle frontend.

Les modules WASM signalés `extraneous` par `npm ls --all` sont des modules optionnels de la chaîne
native Vite/Rolldown. `npm prune` les conserve ; ils ne sont pas déclarés par l’application et ne
sont pas présents dans le bundle produit.

## Parcours local

```bash
npm run prisma:generate
npm run dev:api
npm run dev:web
```

Ouvrir `http://localhost:5173`, créer un compte, terminer l’onboarding, puis accéder à
`/app/create`. Pour activer la génération, renseigner `OPENAI_API_KEY` uniquement dans
l’environnement serveur. Le modèle et le timeout peuvent être ajustés via `OPENAI_MODEL` et
`OPENAI_TIMEOUT_MS`.
