-- CreateEnum
CREATE TYPE "DirectorAnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DirectorAnalysisTrigger" AS ENUM ('MANUAL', 'DAILY', 'EVENT');

-- CreateEnum
CREATE TYPE "DirectorRecommendationType" AS ENUM ('EDITORIAL_GAP', 'CAMPAIGN_GAP', 'OBJECTIVE_IMBALANCE', 'CADENCE_WARNING', 'WORKFLOW_BLOCKER', 'BRAND_PROFILE_INCOMPLETE', 'CONTENT_OPPORTUNITY', 'CALENDAR_SUGGESTION');

-- CreateEnum
CREATE TYPE "DirectorRecommendationStatus" AS ENUM ('NEW', 'VIEWED', 'ACCEPTED', 'DISMISSED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DirectorRecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecommendationFeedbackValue" AS ENUM ('HELPFUL', 'NOT_HELPFUL');

-- CreateTable
CREATE TABLE "director_analyses" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "triggered_by_id" UUID,
    "trigger_type" "DirectorAnalysisTrigger" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "DirectorAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "period_start" TIMESTAMPTZ(3) NOT NULL,
    "period_end" TIMESTAMPTZ(3) NOT NULL,
    "input_summary" JSONB NOT NULL DEFAULT '{}',
    "facts" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "director_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "director_recommendations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "type" "DirectorRecommendationType" NOT NULL,
    "status" "DirectorRecommendationStatus" NOT NULL DEFAULT 'NEW',
    "priority" "DirectorRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "confidence" DECIMAL(3,2) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "suggested_action" JSONB NOT NULL DEFAULT '{}',
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "campaign_id" UUID,
    "content_id" UUID,
    "objective_type" "CommunicationObjectiveType",
    "suggested_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "acted_at" TIMESTAMPTZ(3),
    "acted_by_id" UUID,
    "dismissed_at" TIMESTAMPTZ(3),
    "dismissed_by_id" UUID,
    "dismissal_reason" TEXT,
    "deduplication_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "director_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "director_preferences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "desired_weekly_frequency" INTEGER NOT NULL DEFAULT 3,
    "preferred_weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "preferred_hours" TEXT[] NOT NULL DEFAULT ARRAY['09:00']::TEXT[],
    "silence_threshold_days" INTEGER NOT NULL DEFAULT 7,
    "max_daily_recommendations" INTEGER NOT NULL DEFAULT 5,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "proactivity_level" INTEGER NOT NULL DEFAULT 2,
    "disabled_recommendation_types" "DirectorRecommendationType"[] NOT NULL DEFAULT ARRAY[]::"DirectorRecommendationType"[],
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "director_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_feedback" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "recommendation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" "RecommendationFeedbackValue" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "director_analyses_organization_id_workspace_id_created_at_idx" ON "director_analyses"("organization_id", "workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "director_analyses_organization_id_workspace_id_status_idx" ON "director_analyses"("organization_id", "workspace_id", "status");

-- CreateIndex
CREATE INDEX "director_analyses_triggered_by_id_idx" ON "director_analyses"("triggered_by_id");

-- CreateIndex
CREATE INDEX "director_recommendations_organization_id_workspace_id_statu_idx" ON "director_recommendations"("organization_id", "workspace_id", "status", "priority", "created_at" DESC);

-- CreateIndex
CREATE INDEX "director_recommendations_analysis_id_idx" ON "director_recommendations"("analysis_id");

-- CreateIndex
CREATE INDEX "director_recommendations_campaign_id_idx" ON "director_recommendations"("campaign_id");

-- CreateIndex
CREATE INDEX "director_recommendations_content_id_idx" ON "director_recommendations"("content_id");

-- CreateIndex
CREATE INDEX "director_recommendations_expires_at_idx" ON "director_recommendations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "director_recommendations_organization_id_workspace_id_dedup_key" ON "director_recommendations"("organization_id", "workspace_id", "deduplication_key");

-- CreateIndex
CREATE UNIQUE INDEX "director_preferences_workspace_id_key" ON "director_preferences"("workspace_id");

-- CreateIndex
CREATE INDEX "director_preferences_organization_id_workspace_id_idx" ON "director_preferences"("organization_id", "workspace_id");

-- CreateIndex
CREATE INDEX "recommendation_feedback_organization_id_workspace_id_create_idx" ON "recommendation_feedback"("organization_id", "workspace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "recommendation_feedback_user_id_idx" ON "recommendation_feedback"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_feedback_recommendation_id_user_id_key" ON "recommendation_feedback"("recommendation_id", "user_id");

-- AddForeignKey
ALTER TABLE "director_analyses" ADD CONSTRAINT "director_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_analyses" ADD CONSTRAINT "director_analyses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_analyses" ADD CONSTRAINT "director_analyses_triggered_by_id_fkey" FOREIGN KEY ("triggered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "director_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_acted_by_id_fkey" FOREIGN KEY ("acted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_recommendations" ADD CONSTRAINT "director_recommendations_dismissed_by_id_fkey" FOREIGN KEY ("dismissed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_preferences" ADD CONSTRAINT "director_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "director_preferences" ADD CONSTRAINT "director_preferences_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "director_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Align legacy manually-created index names with Prisma's deterministic names.
ALTER INDEX "audit_logs_organization_id_workspace_id_entity_type_entity_id_c" RENAME TO "audit_logs_organization_id_workspace_id_entity_type_entity__idx";
ALTER INDEX "content_comments_organization_id_workspace_id_content_id_create" RENAME TO "content_comments_organization_id_workspace_id_content_id_cr_idx";
ALTER INDEX "content_items_organization_id_workspace_id_campaign_id_schedule" RENAME TO "content_items_organization_id_workspace_id_campaign_id_sche_idx";
ALTER INDEX "content_items_organization_id_workspace_id_status_scheduled_at_" RENAME TO "content_items_organization_id_workspace_id_status_scheduled_idx";
ALTER INDEX "notifications_recipient_id_organization_id_workspace_id_read_at" RENAME TO "notifications_recipient_id_organization_id_workspace_id_rea_idx";

-- Prisma is the only business data-access layer. Browser roles have no direct access.
ALTER TABLE "director_analyses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "director_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "director_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recommendation_feedback" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  "director_analyses",
  "director_recommendations",
  "director_preferences",
  "recommendation_feedback"
FROM anon, authenticated;
