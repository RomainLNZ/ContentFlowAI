import type { AiExecutionContext } from "../shared";

export type GuardrailStage = "input" | "output";
export type GuardrailCategory =
  "format" | "forbidden_content" | "security" | "compliance" | "hallucination" | "brand_tone";
export type GuardrailViolation = {
  guardrail: string;
  category: GuardrailCategory;
  message: string;
  severity: "warning" | "blocking";
};
export type GuardrailInput = {
  stage: GuardrailStage;
  content: string;
  context: AiExecutionContext;
  metadata: Readonly<Record<string, unknown>>;
};
export type GuardrailResult = {
  accepted: boolean;
  content: string;
  violations: readonly GuardrailViolation[];
};

export interface Guardrail {
  readonly name: string;
  readonly category: GuardrailCategory;
  validate(input: GuardrailInput): Promise<GuardrailResult>;
}

export class GuardrailPipeline {
  constructor(private readonly guardrails: readonly Guardrail[]) {}
  async validate(input: GuardrailInput): Promise<GuardrailResult> {
    let content = input.content;
    const violations: GuardrailViolation[] = [];
    for (const guardrail of this.guardrails) {
      const result = await guardrail.validate({ ...input, content });
      content = result.content;
      violations.push(...result.violations);
    }
    return { accepted: !violations.some(({ severity }) => severity === "blocking"), content, violations };
  }
}
