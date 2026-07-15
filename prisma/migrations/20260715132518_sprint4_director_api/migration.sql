-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'DIRECTOR_ANALYSIS_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'DIRECTOR_HIGH_PRIORITY_RECOMMENDATION';
ALTER TYPE "NotificationType" ADD VALUE 'DIRECTOR_RECOMMENDATION_ACCEPTED';

-- AlterTable
ALTER TABLE "director_preferences" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "recommendation_id" UUID;

-- CreateIndex
CREATE INDEX "notifications_recommendation_id_idx" ON "notifications"("recommendation_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "director_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Logical workspace lock: at most one running Director analysis per tenant.
CREATE UNIQUE INDEX "director_analyses_one_running_per_workspace_idx"
ON "director_analyses" ("organization_id", "workspace_id")
WHERE "status" = 'RUNNING';
