import type { CostEstimate, TokenUsage } from "../shared";

export type AiTelemetryEvent =
  | {
      type: "ai.request.started";
      executionId: string;
      correlationId: string;
      provider: string;
      model: string;
      occurredAt: Date;
    }
  | {
      type: "ai.request.completed";
      executionId: string;
      correlationId: string;
      provider: string;
      model: string;
      durationMs: number;
      usage: TokenUsage;
      cost?: CostEstimate;
      occurredAt: Date;
    }
  | {
      type: "ai.request.failed";
      executionId: string;
      correlationId: string;
      provider: string;
      model: string;
      durationMs: number;
      errorCode: string;
      occurredAt: Date;
    };

export interface AiTelemetry {
  record(event: AiTelemetryEvent): Promise<void>;
}
export class NoopTelemetry implements AiTelemetry {
  async record(): Promise<void> {}
}
export class InMemoryTelemetry implements AiTelemetry {
  readonly events: AiTelemetryEvent[] = [];
  async record(event: AiTelemetryEvent): Promise<void> {
    this.events.push(event);
  }
}
