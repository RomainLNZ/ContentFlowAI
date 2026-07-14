import type { AgentRouter } from "../agents";
import type { ResponseEvaluator, EvaluationCriterion, EvaluationResult } from "../evaluator";
import type { GuardrailPipeline, GuardrailViolation } from "../guardrails";
import type { CompanyMemoryProvider, MemoryFormatter } from "../memory";
import type { ExecutionPlan, Planner } from "../planner";
import type { PromptManager, PromptVariables } from "../prompts";
import type { ProviderRegistry } from "../providers";
import {
  AiCoreError,
  randomIdGenerator,
  systemClock,
  type AiExecutionContext,
  type Clock,
  type CostEstimate,
  type IdGenerator,
  type ModelSettings,
  type TokenUsage,
} from "../shared";
import type { AiTelemetry } from "../telemetry";

export type AiExecutionRequest = {
  objective: string;
  context: AiExecutionContext;
  providerId: string;
  model: ModelSettings;
  prompt: { key: string; version: number };
  promptVariables?: PromptVariables;
  constraints: readonly string[];
  evaluationCriteria: readonly EvaluationCriterion[];
  structuredOutput?: {
    name: string;
    description?: string;
    schema: Readonly<Record<string, unknown>>;
  };
};

export type AiExecutionResult = {
  executionId: string;
  output: string;
  plan: ExecutionPlan;
  evaluation: EvaluationResult;
  guardrailViolations: readonly GuardrailViolation[];
  usage: TokenUsage;
  estimatedCost?: CostEstimate;
};

export type AiOrchestratorDependencies = {
  providers: ProviderRegistry;
  prompts: PromptManager;
  memory: CompanyMemoryProvider;
  memoryFormatter: MemoryFormatter;
  planner: Planner;
  evaluator: ResponseEvaluator;
  inputGuardrails: GuardrailPipeline;
  outputGuardrails: GuardrailPipeline;
  telemetry: AiTelemetry;
  agentRouter?: AgentRouter;
  clock?: Clock;
  ids?: IdGenerator;
};

export class AiOrchestrator {
  private readonly clock: Clock;
  private readonly ids: IdGenerator;
  constructor(private readonly dependencies: AiOrchestratorDependencies) {
    this.clock = dependencies.clock ?? systemClock;
    this.ids = dependencies.ids ?? randomIdGenerator;
  }

  async execute(request: AiExecutionRequest, signal?: AbortSignal): Promise<AiExecutionResult> {
    const executionId = this.ids.next();
    const inputValidation = await this.dependencies.inputGuardrails.validate({
      stage: "input",
      content: request.objective,
      context: request.context,
      metadata: {},
    });
    if (!inputValidation.accepted)
      throw new AiCoreError(
        "GUARDRAIL_REJECTED",
        "AI input rejected by guardrails",
        inputValidation.violations,
      );

    const memory = await this.dependencies.memory.load(request.context);
    const formattedMemory = this.dependencies.memoryFormatter.format(memory);
    const plan = await this.dependencies.planner.plan({
      objective: inputValidation.content,
      constraints: request.constraints,
      context: request.context,
    });
    const outputs: string[] = [];
    const violations: GuardrailViolation[] = [];
    const usage: TokenUsage = { input: 0, output: 0, total: 0 };
    let totalCost = 0;

    for (const task of plan.tasks) {
      const agent = await this.dependencies.agentRouter?.resolve(
        task.description,
        request.context,
        task.preferredAgent,
      );
      const provider = this.dependencies.providers.get(agent?.providerId ?? request.providerId);
      const model = agent?.model ?? request.model;
      const prompt = agent?.prompt ?? request.prompt;
      const rendered = await this.dependencies.prompts.render(
        prompt.key,
        {
          ...request.promptVariables,
          memory: formattedMemory,
          constraints: request.constraints.join("\n"),
          objective: request.objective,
          step: task.description,
        },
        prompt.version,
      );
      const startedAt = this.clock.now();
      await this.dependencies.telemetry.record({
        type: "ai.request.started",
        executionId,
        correlationId: request.context.correlationId,
        provider: provider.descriptor.id,
        model: model.model,
        occurredAt: startedAt,
      });
      try {
        const response = await provider.generate(
          {
            messages: [
              { role: "system", content: rendered.system },
              { role: "user", content: rendered.user },
            ],
            settings: model,
            ...(request.structuredOutput ? { structuredOutput: request.structuredOutput } : {}),
          },
          signal,
        );
        const checked = await this.dependencies.outputGuardrails.validate({
          stage: "output",
          content: response.content,
          context: request.context,
          metadata: { taskId: task.id },
        });
        violations.push(...checked.violations);
        if (!checked.accepted)
          throw new AiCoreError(
            "GUARDRAIL_REJECTED",
            `AI output rejected for task ${task.id}`,
            checked.violations,
          );
        outputs.push(checked.content);
        usage.input += response.usage.input;
        usage.output += response.usage.output;
        usage.total += response.usage.total;
        totalCost += response.estimatedCost?.amount ?? 0;
        await this.dependencies.telemetry.record({
          type: "ai.request.completed",
          executionId,
          correlationId: request.context.correlationId,
          provider: provider.descriptor.id,
          model: response.model,
          durationMs: this.clock.now().getTime() - startedAt.getTime(),
          usage: response.usage,
          ...(response.estimatedCost ? { cost: response.estimatedCost } : {}),
          occurredAt: this.clock.now(),
        });
      } catch (error) {
        await this.dependencies.telemetry.record({
          type: "ai.request.failed",
          executionId,
          correlationId: request.context.correlationId,
          provider: provider.descriptor.id,
          model: model.model,
          durationMs: this.clock.now().getTime() - startedAt.getTime(),
          errorCode: error instanceof AiCoreError ? error.code : "PROVIDER_ERROR",
          occurredAt: this.clock.now(),
        });
        throw error;
      }
    }

    const output = outputs.join("\n\n");
    const evaluation = await this.dependencies.evaluator.evaluate({
      objective: request.objective,
      output,
      context: request.context,
      criteria: request.evaluationCriteria,
    });
    return {
      executionId,
      output,
      plan,
      evaluation,
      guardrailViolations: violations,
      usage,
      ...(totalCost > 0 ? { estimatedCost: { amount: totalCost, currency: "USD" } } : {}),
    };
  }
}
