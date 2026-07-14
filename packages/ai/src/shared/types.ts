export type AiExecutionContext = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  correlationId: string;
  locale: string;
};

export type AiMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; name?: string };
export type ModelSettings = {
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: "text" | "json";
};
export type TokenUsage = { input: number; output: number; total: number };
export type CostEstimate = { amount: number; currency: "USD" };

export type ModelRequest = {
  messages: readonly AiMessage[];
  settings: ModelSettings;
  tools?: readonly Readonly<Record<string, unknown>>[];
  structuredOutput?: {
    name: string;
    description?: string;
    schema: Readonly<Record<string, unknown>>;
  };
};
export type ModelResponse = {
  content: string;
  model: string;
  providerRequestId?: string;
  finishReason?: string;
  usage: TokenUsage;
  estimatedCost?: CostEstimate;
  raw?: unknown;
};

export type AiErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "PROMPT_NOT_FOUND"
  | "MEMORY_UNAVAILABLE"
  | "GUARDRAIL_REJECTED"
  | "PLANNING_FAILED"
  | "EVALUATION_FAILED"
  | "EXECUTION_FAILED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_REFUSAL"
  | "INVALID_STRUCTURED_OUTPUT";

export class AiCoreError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiCoreError";
  }
}
