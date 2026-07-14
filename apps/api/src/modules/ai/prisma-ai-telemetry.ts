import type { PrismaClient } from "@prisma/client";
import type { AiTelemetry, AiTelemetryEvent } from "@flowpilot/ai";

export class PrismaAiTelemetry implements AiTelemetry {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly generationId: string,
    private readonly organizationId: string,
    private readonly workspaceId: string,
  ) {}

  async record(event: AiTelemetryEvent): Promise<void> {
    if (event.type === "ai.request.started") return;
    await this.prisma.aiGeneration.updateMany({
      where: {
        id: this.generationId,
        organizationId: this.organizationId,
        workspaceId: this.workspaceId,
      },
      data:
        event.type === "ai.request.completed"
          ? {
              inputTokens: event.usage.input,
              outputTokens: event.usage.output,
              totalTokens: event.usage.total,
              durationMs: event.durationMs,
              ...(event.cost ? { estimatedCost: event.cost.amount, currency: event.cost.currency } : {}),
            }
          : { durationMs: event.durationMs, errorCode: event.errorCode },
    });
  }
}
