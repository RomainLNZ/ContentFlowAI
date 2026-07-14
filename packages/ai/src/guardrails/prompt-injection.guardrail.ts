import type { Guardrail, GuardrailInput, GuardrailResult } from "./guardrail";

const suspiciousPatterns = [
  /ignore (all|any|the) previous instructions/i,
  /révèle.{0,20}(prompt|instructions système)/i,
  /system prompt/i,
  /jailbreak/i,
];

export class PromptInjectionGuardrail implements Guardrail {
  readonly name = "prompt-injection";
  readonly category = "security" as const;

  async validate(input: GuardrailInput): Promise<GuardrailResult> {
    const detected = suspiciousPatterns.some((pattern) => pattern.test(input.content));
    return {
      accepted: !detected,
      content: input.content,
      violations: detected
        ? [
            {
              guardrail: this.name,
              category: this.category,
              message: "Tentative de contournement des instructions détectée.",
              severity: "blocking",
            },
          ]
        : [],
    };
  }
}
