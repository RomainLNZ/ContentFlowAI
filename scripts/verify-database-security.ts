import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const businessTables = [
  "users",
  "organizations",
  "workspaces",
  "teams",
  "roles",
  "permissions",
  "role_permissions",
  "organization_memberships",
  "workspace_memberships",
  "team_memberships",
  "invitations",
  "plans",
  "feature_flags",
  "plan_features",
  "organization_feature_overrides",
  "billing_accounts",
  "outbox_events",
  "audit_logs",
  "onboarding_progress",
  "brand_profiles",
  "communication_objectives",
  "ai_generations",
  "content_variants",
  "content_items",
  "campaigns",
  "content_comments",
  "notifications",
] as const;

type NamedRow = { name: string };
type CountRow = { count: bigint };

async function main() {
  const rlsTables = await prisma.$queryRaw<NamedRow[]>`
    SELECT tablename::text AS name
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity
  `;
  const secured = new Set(rlsTables.map(({ name }) => name));
  const missingRls = businessTables.filter((table) => !secured.has(table));

  const [policies] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM pg_policies
    WHERE schemaname = 'public'
  `;
  const [directGrants] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
  `;
  const [sequenceGrants] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM information_schema.role_usage_grants
    WHERE object_schema = 'public'
      AND object_type = 'SEQUENCE'
      AND grantee IN ('anon', 'authenticated')
  `;
  const [functionGrants] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM information_schema.role_routine_grants
    WHERE routine_schema = 'public' AND grantee IN ('anon', 'authenticated')
  `;

  const failures = [
    ...(missingRls.length > 0 ? [`RLS absent: ${missingRls.join(", ")}`] : []),
    ...(policies?.count === 0n ? [] : [`Policies public inattendues: ${policies?.count ?? "?"}`]),
    ...(directGrants?.count === 0n
      ? []
      : [`Privilèges table anon/authenticated: ${directGrants?.count ?? "?"}`]),
    ...(sequenceGrants?.count === 0n
      ? []
      : [`Privilèges séquence anon/authenticated: ${sequenceGrants?.count ?? "?"}`]),
    ...(functionGrants?.count === 0n
      ? []
      : [`Privilèges fonction anon/authenticated: ${functionGrants?.count ?? "?"}`]),
  ];

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }

  console.log(
    `Sécurité SQL validée: ${businessTables.length} tables avec RLS, aucune policy et aucun privilège direct anon/authenticated.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
