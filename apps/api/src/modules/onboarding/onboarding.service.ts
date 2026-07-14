import { Prisma, type PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import type { CompleteOnboardingInput } from "./onboarding.schema.js";

export class OnboardingService {
  constructor(private readonly prisma: PrismaClient) {}

  getProgress(userId: string) {
    return this.prisma.onboardingProgress.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  saveProgress(userId: string, currentStep: number, draft: Prisma.InputJsonValue) {
    return this.prisma.onboardingProgress.upsert({
      where: { userId },
      update: { currentStep, draft },
      create: { userId, currentStep, draft },
    });
  }

  async complete(userId: string, input: CompleteOnboardingInput) {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const progress = await transaction.onboardingProgress.upsert({
            where: { userId },
            update: {},
            create: { userId },
          });
          if (progress.completedOrganizationId) {
            return transaction.organization.findUniqueOrThrow({
              where: { id: progress.completedOrganizationId },
              include: { workspaces: { where: { isDefault: true }, take: 1 } },
            });
          }

          const ownerRole = await transaction.role.findFirst({
            where: { systemKey: "OWNER", isSystem: true },
          });
          if (!ownerRole) {
            throw new HttpError(500, "OWNER_ROLE_MISSING", "Le rôle OWNER n’est pas initialisé.");
          }

          const organization = await transaction.organization.create({
            data: {
              name: input.organization.name,
              slug: input.organization.slug,
              primaryLanguage: input.organization.primaryLanguage,
              values: input.organization.values,
              forbiddenWords: input.organization.forbiddenWords,
              favoriteExpressions: input.organization.favoriteExpressions,
              ...(input.organization.websiteUrl ? { websiteUrl: input.organization.websiteUrl } : {}),
              ...(input.organization.industry ? { industry: input.organization.industry } : {}),
              ...(input.organization.description ? { description: input.organization.description } : {}),
              ...(input.organization.mission ? { mission: input.organization.mission } : {}),
              ...(input.organization.countryCode ? { countryCode: input.organization.countryCode } : {}),
              ...(input.organization.communicationTone
                ? { communicationTone: input.organization.communicationTone }
                : {}),
              createdById: userId,
              workspaces: {
                create: {
                  ...input.workspace,
                  isDefault: true,
                },
              },
            },
            include: { workspaces: { where: { isDefault: true }, take: 1 } },
          });
          const workspace = organization.workspaces[0];
          if (!workspace) throw new HttpError(500, "WORKSPACE_MISSING", "Workspace principal absent.");

          await Promise.all([
            transaction.organizationMembership.create({
              data: {
                organizationId: organization.id,
                userId,
                roleId: ownerRole.id,
                status: "ACTIVE",
                joinedAt: new Date(),
              },
            }),
            transaction.workspaceMembership.create({
              data: { workspaceId: workspace.id, userId, roleId: ownerRole.id, status: "ACTIVE" },
            }),
            transaction.brandProfile.create({
              data: {
                organizationId: organization.id,
                workspaceId: workspace.id,
                ...input.brandProfile,
              },
            }),
            transaction.communicationObjective.createMany({
              data: input.objectives.map((objective) => ({
                organizationId: organization.id,
                workspaceId: workspace.id,
                ...objective,
              })),
            }),
          ]);

          await Promise.all([
            transaction.onboardingProgress.update({
              where: { userId },
              data: {
                currentStep: 5,
                draft: input as unknown as Prisma.InputJsonValue,
                completedAt: new Date(),
                completedOrganizationId: organization.id,
              },
            }),
            transaction.user.update({ where: { id: userId }, data: { onboardingDone: true } }),
          ]);

          return organization;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new HttpError(409, "ORGANIZATION_SLUG_TAKEN", "Ce nom d’organisation est déjà utilisé.");
      }
      throw error;
    }
  }
}
