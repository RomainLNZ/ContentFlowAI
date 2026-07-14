import { fileURLToPath } from "node:url";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  AiCoreError,
  AiOrchestrator,
  ContentLengthGuardrail,
  FilePromptSource,
  ForbiddenTermsGuardrail,
  GuardrailPipeline,
  linkedInGenerationSchema,
  OpenAiProvider,
  PassThroughEvaluator,
  PromptInjectionGuardrail,
  PromptManager,
  ProviderRegistry,
  SingleTaskPlanner,
  SocialContentAgent,
  StructuredMemoryFormatter,
} from "@flowpilot/ai";
import { PrismaCompanyMemoryProvider } from "./prisma-company-memory.js";
import { PrismaAiTelemetry } from "./prisma-ai-telemetry.js";
import type { LinkedInGenerationRequest } from "./linkedin-generation.schema.js";

type GenerationContext = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  correlationId: string;
  locale: string;
};

type GenerationConfiguration = {
  apiKey?: string;
  model: string;
  timeoutMs: number;
};

export class LinkedInGenerationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly configuration: GenerationConfiguration,
  ) {}

  isConfigured() {
    return Boolean(this.configuration.apiKey);
  }

  async generate(context: GenerationContext, input: LinkedInGenerationRequest) {
    if (!this.isConfigured()) {
      throw new AiCoreError("PROVIDER_UNAVAILABLE", "Le fournisseur IA n’est pas configuré.");
    }
    const agent = new SocialContentAgent(this.configuration.model);
    const generation = await this.prisma.aiGeneration.create({
      data: {
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        userId: context.userId,
        provider: agent.definition.providerId,
        model: this.configuration.model,
        agentType: agent.definition.key,
        request: input,
      },
    });

    try {
      const providers = new ProviderRegistry();
      providers.register(
        new OpenAiProvider({
          ...(this.configuration.apiKey ? { apiKey: this.configuration.apiKey } : {}),
          timeoutMs: this.configuration.timeoutMs,
        }),
      );
      const memory = new PrismaCompanyMemoryProvider(this.prisma);
      const promptDirectory = fileURLToPath(
        new URL("../../../../../packages/ai/prompts/catalog", import.meta.url),
      );
      const organization = await this.prisma.organization.findFirstOrThrow({
        where: { id: context.organizationId, archivedAt: null },
        select: { forbiddenWords: true },
      });
      const orchestrator = new AiOrchestrator({
        providers,
        prompts: new PromptManager(new FilePromptSource(promptDirectory)),
        memory,
        memoryFormatter: new StructuredMemoryFormatter(),
        planner: new SingleTaskPlanner(),
        evaluator: new PassThroughEvaluator(),
        inputGuardrails: new GuardrailPipeline([
          new ContentLengthGuardrail(8_000),
          new PromptInjectionGuardrail(),
        ]),
        outputGuardrails: new GuardrailPipeline([
          new ContentLengthGuardrail(24_000),
          new ForbiddenTermsGuardrail(organization.forbiddenWords),
        ]),
        telemetry: new PrismaAiTelemetry(
          this.prisma,
          generation.id,
          context.organizationId,
          context.workspaceId,
        ),
      });

      const result = await orchestrator.execute({
        objective: input.objective,
        context,
        providerId: agent.definition.providerId,
        model: agent.definition.model,
        prompt: agent.definition.prompt,
        promptVariables: {
          brief: input.brief,
          audience: input.audience,
          tone: input.tone,
        },
        constraints: [
          "Ne jamais inventer de faits ou de résultats.",
          "Respecter les conventions éditoriales LinkedIn.",
          "Retourner exactement trois variantes distinctes.",
        ],
        evaluationCriteria: [],
        structuredOutput: {
          name: "linkedin_content_variants",
          description: "Trois variantes de publication LinkedIn validées.",
          schema: z.toJSONSchema(linkedInGenerationSchema) as Readonly<Record<string, unknown>>,
        },
      });

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(result.output);
      } catch (error) {
        throw new AiCoreError("INVALID_STRUCTURED_OUTPUT", "La réponse IA n’est pas un JSON valide.", error);
      }
      const parsed = linkedInGenerationSchema.safeParse(parsedJson);
      if (!parsed.success) {
        throw new AiCoreError(
          "INVALID_STRUCTURED_OUTPUT",
          "La réponse IA ne respecte pas la structure attendue.",
          parsed.error,
        );
      }

      const variants = await this.prisma.$transaction(async (transaction) => {
        const created = await Promise.all(
          parsed.data.variants.map((variant, position) =>
            transaction.contentVariant.create({
              data: {
                generationId: generation.id,
                organizationId: context.organizationId,
                workspaceId: context.workspaceId,
                position,
                ...variant,
              },
            }),
          ),
        );
        await transaction.aiGeneration.updateMany({
          where: {
            id: generation.id,
            organizationId: context.organizationId,
            workspaceId: context.workspaceId,
          },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            inputTokens: result.usage.input,
            outputTokens: result.usage.output,
            totalTokens: result.usage.total,
            ...(result.estimatedCost
              ? { estimatedCost: new Prisma.Decimal(result.estimatedCost.amount) }
              : {}),
          },
        });
        return created;
      });
      return { generationId: generation.id, variants, usage: result.usage };
    } catch (error) {
      const code = error instanceof AiCoreError ? error.code : "EXECUTION_FAILED";
      await this.prisma.aiGeneration.updateMany({
        where: {
          id: generation.id,
          organizationId: context.organizationId,
          workspaceId: context.workspaceId,
        },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorCode: code,
          errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : "Erreur inconnue",
        },
      });
      throw error;
    }
  }
}
