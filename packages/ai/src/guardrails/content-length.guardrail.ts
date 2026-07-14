import type { Guardrail, GuardrailInput, GuardrailResult } from "./guardrail";

export class ContentLengthGuardrail implements Guardrail {
  readonly name = "content-length";
  readonly category = "format" as const;

  constructor(private readonly maximum: number) {}

  async validate(input: GuardrailInput): Promise<GuardrailResult> {
    const exceeded = input.content.length > this.maximum;
    return {
      accepted: !exceeded,
      content: input.content,
      violations: exceeded
        ? [
            {
              guardrail: this.name,
              category: this.category,
              message: `Le contenu dépasse la limite de ${this.maximum} caractères.`,
              severity: "blocking",
            },
          ]
        : [],
    };
  }
}
