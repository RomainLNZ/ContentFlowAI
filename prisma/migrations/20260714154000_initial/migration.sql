-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('PLATFORM', 'ORGANIZATION', 'WORKSPACE', 'TEAM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "supabase_auth_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "avatar_path" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr-FR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "onboarding_done" BOOLEAN NOT NULL DEFAULT false,
    "platform_role_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_path" TEXT,
    "website_url" TEXT,
    "industry" TEXT,
    "description" TEXT,
    "mission" TEXT,
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brand_colors" JSONB NOT NULL DEFAULT '{}',
    "communication_tone" TEXT,
    "forbidden_words" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favorite_expressions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "system_key" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("organization_id","user_id")
);

-- CreateTable
CREATE TABLE "workspace_memberships" (
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("workspace_id","user_id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("team_id","user_id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID,
    "team_id" UUID,
    "role_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "plan_id" UUID NOT NULL,
    "feature_flag_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("plan_id","feature_flag_id")
);

-- CreateTable
CREATE TABLE "organization_feature_overrides" (
    "organization_id" UUID NOT NULL,
    "feature_flag_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "configuration" JSONB,
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organization_feature_overrides_pkey" PRIMARY KEY ("organization_id","feature_flag_id")
);

-- CreateTable
CREATE TABLE "billing_accounts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plan_id" UUID,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "current_period_end" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(3),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "organization_id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_auth_id_key" ON "users"("supabase_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_platform_role_id_idx" ON "users"("platform_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_created_by_id_idx" ON "organizations"("created_by_id");

-- CreateIndex
CREATE INDEX "workspaces_organization_id_archived_at_idx" ON "workspaces"("organization_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_organization_id_slug_key" ON "workspaces"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "teams_workspace_id_archived_at_idx" ON "teams"("workspace_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "teams_workspace_id_slug_key" ON "teams"("workspace_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_system_key_key" ON "roles"("system_key");

-- CreateIndex
CREATE INDEX "roles_key_scope_is_system_idx" ON "roles"("key", "scope", "is_system");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_key_scope_key" ON "roles"("organization_id", "key", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "organization_memberships_user_id_status_idx" ON "organization_memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "organization_memberships_organization_id_role_id_status_idx" ON "organization_memberships"("organization_id", "role_id", "status");

-- CreateIndex
CREATE INDEX "workspace_memberships_user_id_status_idx" ON "workspace_memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "workspace_memberships_workspace_id_role_id_status_idx" ON "workspace_memberships"("workspace_id", "role_id", "status");

-- CreateIndex
CREATE INDEX "team_memberships_user_id_status_idx" ON "team_memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "team_memberships_team_id_role_id_status_idx" ON "team_memberships"("team_id", "role_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_email_expires_at_idx" ON "invitations"("email", "expires_at");

-- CreateIndex
CREATE INDEX "invitations_workspace_id_idx" ON "invitations"("workspace_id");

-- CreateIndex
CREATE INDEX "invitations_team_id_idx" ON "invitations"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_organization_id_email_key" ON "invitations"("organization_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "organization_feature_overrides_expires_at_idx" ON "organization_feature_overrides"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_organization_id_key" ON "billing_accounts"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_stripe_customer_id_key" ON "billing_accounts"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_stripe_subscription_id_key" ON "billing_accounts"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "billing_accounts_plan_id_idx" ON "billing_accounts"("plan_id");

-- CreateIndex
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "outbox_events_organization_id_created_at_idx" ON "outbox_events"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx" ON "outbox_events"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_platform_role_id_fkey" FOREIGN KEY ("platform_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_feature_overrides" ADD CONSTRAINT "organization_feature_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_feature_overrides" ADD CONSTRAINT "organization_feature_overrides_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
