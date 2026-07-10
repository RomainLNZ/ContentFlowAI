import type { Guardrail, GuardrailInput, GuardrailResult } from "./guardrail";

export class ForbiddenTermsGuardrail implements Guardrail {
  readonly name = "forbidden-terms";
  readonly category = "forbidden_content" as const;
  constructor(private readonly terms: readonly string[]) {}
  async validate(input: GuardrailInput): Promise<GuardrailResult> {
    const normalized = input.content.toLocaleLowerCase();
    const found = this.terms.filter((term) => normalized.includes(term.toLocaleLowerCase()));
    return {
      accepted: found.length === 0,
      content: input.content,
      violations: found.map((term) => ({
        guardrail: this.name,
        category: this.category,
        message: `Terme interdit détecté : ${term}`,
        severity: "blocking",
      })),
    };
  }
}
