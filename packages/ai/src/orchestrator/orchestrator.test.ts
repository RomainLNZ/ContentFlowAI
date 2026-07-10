import { describe, expect, it, vi } from "vitest";
import { PassThroughEvaluator } from "../evaluator";
import { GuardrailPipeline } from "../guardrails";
import { StructuredMemoryFormatter, type CompanyMemoryProvider } from "../memory";
import { SingleTaskPlanner } from "../planner";
import { InMemoryPromptSource, PromptManager } from "../prompts";
import { ProviderRegistry, type AiProvider } from "../providers";
import { InMemoryTelemetry } from "../telemetry";
import { AiOrchestrator } from "./orchestrator";

describe("AiOrchestrator", () => {
  it("charge obligatoirement la mémoire avant toute génération et collecte la télémétrie", async () => {
    const order: string[] = [];
    const memory: CompanyMemoryProvider = {
      load: vi.fn(async (context) => {
        order.push("memory");
        return {
          organizationId: context.organizationId,
          assembledAt: new Date(),
          items: [
            {
              id: "brand",
              category: "brand_identity" as const,
              content: "Atelier Horizon",
              metadata: {},
              updatedAt: new Date(),
            },
          ],
        };
      }),
      search: vi.fn(async () => []),
    };
    const provider: AiProvider = {
      descriptor: {
        id: "fake",
        displayName: "Fake",
        capabilities: ["text"],
        status: "available",
        configurationKeys: [],
      },
      isAvailable: async () => true,
      generate: vi.fn(async () => {
        order.push("provider");
        return {
          content: "Contenu généré",
          model: "fake-model",
          usage: { input: 10, output: 5, total: 15 },
          estimatedCost: { amount: 0.01, currency: "USD" as const },
        };
      }),
    };
    const providers = new ProviderRegistry();
    providers.register(provider);
    const telemetry = new InMemoryTelemetry();
    const orchestrator = new AiOrchestrator({
      providers,
      prompts: new PromptManager(
        new InMemoryPromptSource([
          {
            key: "core.task",
            version: 1,
            description: "Test",
            system: "{{memory}} {{constraints}}",
            user: "{{objective}} {{step}}",
            requiredVariables: ["memory", "constraints", "objective", "step"],
          },
        ]),
      ),
      memory,
      memoryFormatter: new StructuredMemoryFormatter(),
      planner: new SingleTaskPlanner(),
      evaluator: new PassThroughEvaluator(),
      inputGuardrails: new GuardrailPipeline([]),
      outputGuardrails: new GuardrailPipeline([]),
      telemetry,
      ids: { next: () => "execution-1" },
    });

    const result = await orchestrator.execute({
      objective: "Créer un contenu",
      context: {
        organizationId: "org",
        workspaceId: "workspace",
        userId: "user",
        correlationId: "correlation",
        locale: "fr-FR",
      },
      providerId: "fake",
      model: { model: "fake-model" },
      prompt: { key: "core.task", version: 1 },
      constraints: [],
      evaluationCriteria: [],
    });
    expect(order).toEqual(["memory", "provider"]);
    expect(result).toMatchObject({
      executionId: "execution-1",
      output: "Contenu généré",
      usage: { total: 15 },
      estimatedCost: { amount: 0.01 },
    });
    expect(telemetry.events.map(({ type }) => type)).toEqual(["ai.request.started", "ai.request.completed"]);
  });
});
