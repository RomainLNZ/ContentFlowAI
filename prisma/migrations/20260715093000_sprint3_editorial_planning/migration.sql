-- Sprint 3 — Editorial Planning & Workflow
ALTER TYPE "ContentStatus" ADD VALUE 'CHANGES_REQUESTED';
ALTER TYPE "ContentStatus" ADD VALUE 'APPROVED';
ALTER TYPE "ContentStatus" ADD VALUE 'SCHEDULED';
ALTER TYPE "ContentStatus" ADD VALUE 'PUBLISHED';

CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "NotificationType" AS ENUM (
  'CONTENT_ASSIGNED',
  'REVIEW_REQUESTED',
  'CONTENT_APPROVED',
  'CHANGES_REQUESTED',
  'COMMENT_ADDED',
  'CONTENT_SCHEDULED'
);

ALTER TABLE "audit_logs" ADD COLUMN "workspace_id" UUID;

ALTER TABLE "content_items"
  ADD COLUMN "cta" TEXT,
  ADD COLUMN "hashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "scheduled_at" TIMESTAMPTZ(3),
  ADD COLUMN "published_at" TIMESTAMPTZ(3),
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
  ADD COLUMN "approval_requested_at" TIMESTAMPTZ(3),
  ADD COLUMN "approved_at" TIMESTAMPTZ(3),
  ADD COLUMN "approved_by_id" UUID,
  ADD COLUMN "assignee_id" UUID,
  ADD COLUMN "reviewer_id" UUID,
  ADD COLUMN "campaign_id" UUID;

CREATE TABLE "campaigns" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "created_by_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "objective" TEXT,
  "start_date" DATE,
  "end_date" DATE,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "color" TEXT NOT NULL DEFAULT '#8B5CF6',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "archived_at" TIMESTAMPTZ(3),
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content_comments" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "content_id" UUID NOT NULL,
  "author_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "mentioned_user_ids" UUID[] DEFAULT ARRAY[]::UUID[],
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "content_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "actor_id" UUID,
  "content_id" UUID,
  "type" "NotificationType" NOT NULL,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "read_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_comments" ADD CONSTRAINT "content_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "audit_logs_organization_id_workspace_id_entity_type_entity_id_created_at_idx" ON "audit_logs"("organization_id", "workspace_id", "entity_type", "entity_id", "created_at" DESC);
CREATE INDEX "content_items_organization_id_workspace_id_scheduled_at_idx" ON "content_items"("organization_id", "workspace_id", "scheduled_at");
CREATE INDEX "content_items_organization_id_workspace_id_status_scheduled_at_idx" ON "content_items"("organization_id", "workspace_id", "status", "scheduled_at");
CREATE INDEX "content_items_organization_id_workspace_id_campaign_id_scheduled_at_idx" ON "content_items"("organization_id", "workspace_id", "campaign_id", "scheduled_at");
CREATE INDEX "content_items_assignee_id_status_idx" ON "content_items"("assignee_id", "status");
CREATE INDEX "content_items_reviewer_id_status_idx" ON "content_items"("reviewer_id", "status");
CREATE INDEX "campaigns_organization_id_workspace_id_status_start_date_idx" ON "campaigns"("organization_id", "workspace_id", "status", "start_date");
CREATE INDEX "campaigns_created_by_id_idx" ON "campaigns"("created_by_id");
CREATE INDEX "content_comments_organization_id_workspace_id_content_id_created_at_idx" ON "content_comments"("organization_id", "workspace_id", "content_id", "created_at");
CREATE INDEX "content_comments_author_id_idx" ON "content_comments"("author_id");
CREATE INDEX "notifications_recipient_id_organization_id_workspace_id_read_at_created_at_idx" ON "notifications"("recipient_id", "organization_id", "workspace_id", "read_at", "created_at" DESC);
CREATE INDEX "notifications_content_id_idx" ON "notifications"("content_id");

ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE "campaigns", "content_comments", "notifications" FROM anon, authenticated;
