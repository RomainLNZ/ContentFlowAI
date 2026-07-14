-- CreateEnum
CREATE TYPE "CommunicationObjectiveType" AS ENUM ('AWARENESS', 'RECRUITMENT', 'LEAD_GENERATION', 'EMPLOYER_BRAND', 'EXPERTISE', 'TRAFFIC', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "BrandFormalityLevel" AS ENUM ('CASUAL', 'BALANCED', 'FORMAL');

-- CreateEnum
CREATE TYPE "EmojiUsage" AS ENUM ('NONE', 'LIGHT', 'MODERATE');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SOCIAL_POST');

-- CreateEnum
CREATE TYPE "ContentPlatform" AS ENUM ('LINKEDIN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentVariantStyle" AS ENUM ('DIRECT_CONCISE', 'EXPERT_EDUCATIONAL', 'HUMAN_ENGAGING');

-- CreateEnum
CREATE TYPE "AiGenerationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "country_code" TEXT,
ADD COLUMN     "primary_language" TEXT NOT NULL DEFAULT 'fr';

-- CreateTable
CREATE TABLE "onboarding_progress" (
    "user_id" UUID NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "draft" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMPTZ(3),
    "completed_organization_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "products_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audiences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "formality_level" "BrandFormalityLevel" NOT NULL DEFAULT 'BALANCED',
    "emoji_usage" "EmojiUsage" NOT NULL DEFAULT 'LIGHT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_objectives" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "type" "CommunicationObjectiveType" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL DEFAULT 'SOCIAL_POST',
    "status" "AiGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "estimated_cost" DECIMAL(12,6),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "request" JSONB NOT NULL DEFAULT '{}',
    "error_code" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_variants" (
    "id" UUID NOT NULL,
    "generation_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "style" "ContentVariantStyle" NOT NULL,
    "angle" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rationale" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "source_variant_id" UUID,
    "type" "ContentType" NOT NULL DEFAULT 'SOCIAL_POST',
    "platform" "ContentPlatform" NOT NULL DEFAULT 'LINKEDIN',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "objective" "CommunicationObjectiveType",
    "tone" TEXT,
    "target_audience" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3),

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_progress_completed_organization_id_key" ON "onboarding_progress"("completed_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profiles_workspace_id_key" ON "brand_profiles"("workspace_id");

-- CreateIndex
CREATE INDEX "brand_profiles_organization_id_idx" ON "brand_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "communication_objectives_organization_id_idx" ON "communication_objectives"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "communication_objectives_workspace_id_type_key" ON "communication_objectives"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "ai_generations_organization_id_workspace_id_created_at_idx" ON "ai_generations"("organization_id", "workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_generations_user_id_status_idx" ON "ai_generations"("user_id", "status");

-- CreateIndex
CREATE INDEX "content_variants_organization_id_workspace_id_idx" ON "content_variants"("organization_id", "workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_variants_generation_id_position_key" ON "content_variants"("generation_id", "position");

-- CreateIndex
CREATE INDEX "content_items_organization_id_workspace_id_status_updated_a_idx" ON "content_items"("organization_id", "workspace_id", "status", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "content_items_author_id_idx" ON "content_items"("author_id");

-- CreateIndex
CREATE INDEX "content_items_source_variant_id_idx" ON "content_items"("source_variant_id");

-- AddForeignKey
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_completed_organization_id_fkey" FOREIGN KEY ("completed_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_objectives" ADD CONSTRAINT "communication_objectives_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_objectives" ADD CONSTRAINT "communication_objectives_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "ai_generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_source_variant_id_fkey" FOREIGN KEY ("source_variant_id") REFERENCES "content_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Security boundary: business data is exclusively accessed by the server-side API.
-- No browser-facing RLS policies are intentionally created.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feature_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_feature_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "onboarding_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "brand_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communication_objectives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_generations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_items" ENABLE ROW LEVEL SECURITY;

-- _prisma_migrations is deliberately not treated as a business table and has no RLS.
-- Revoke existing and future browser-role privileges on public application objects.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON FUNCTIONS FROM anon, authenticated;
