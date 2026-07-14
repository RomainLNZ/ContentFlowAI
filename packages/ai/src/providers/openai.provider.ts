import OpenAI from "openai";
import { AiCoreError, type ModelRequest, type ModelResponse } from "../shared";
import type { AiProvider } from "./provider";

export type OpenAiProviderOptions = {
  apiKey?: string;
  timeoutMs?: number;
};

export class OpenAiProvider implements AiProvider {
  readonly descriptor = {
    id: "openai",
    displayName: "OpenAI",
    capabilities: ["text", "json"] as const,
    status: "available" as const,
    configurationKeys: ["OPENAI_API_KEY"] as const,
  };
  private readonly client?: OpenAI;
  private readonly timeoutMs: number;

  constructor(options: OpenAiProviderOptions) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
    if (options.apiKey) this.client = new OpenAI({ apiKey: options.apiKey, timeout: this.timeoutMs });
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.client);
  }

  async generate(request: ModelRequest, signal?: AbortSignal): Promise<ModelResponse> {
    if (!this.client) {
      throw new AiCoreError("PROVIDER_UNAVAILABLE", "OpenAI n’est pas configuré.");
    }
    try {
      const input: OpenAI.Responses.ResponseInput = request.messages.flatMap((message) =>
        message.role === "tool" ? [] : [{ role: message.role, content: message.content }],
      );
      const response = await this.client.responses.create(
        {
          model: request.settings.model,
          input,
          ...(request.settings.maxOutputTokens
            ? { max_output_tokens: request.settings.maxOutputTokens }
            : {}),
          ...(request.settings.temperature === undefined
            ? {}
            : { temperature: request.settings.temperature }),
          ...(request.structuredOutput
            ? {
                text: {
                  format: {
                    type: "json_schema" as const,
                    name: request.structuredOutput.name,
                    schema: request.structuredOutput.schema,
                    strict: true,
                    ...(request.structuredOutput.description
                      ? { description: request.structuredOutput.description }
                      : {}),
                  },
                },
              }
            : {}),
        },
        { signal, timeout: this.timeoutMs },
      );

      const refusal = response.output
        .flatMap((item) => (item.type === "message" ? item.content : []))
        .find((item) => item.type === "refusal");
      if (refusal) throw new AiCoreError("PROVIDER_REFUSAL", refusal.refusal);
      if (!response.output_text) {
        throw new AiCoreError("INVALID_STRUCTURED_OUTPUT", "OpenAI n’a retourné aucun contenu exploitable.");
      }

      return {
        content: response.output_text,
        model: response.model,
        providerRequestId: response.id,
        ...(response.status ? { finishReason: response.status } : {}),
        usage: {
          input: response.usage?.input_tokens ?? 0,
          output: response.usage?.output_tokens ?? 0,
          total: response.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof AiCoreError) throw error;
      if (
        error instanceof OpenAI.APIConnectionTimeoutError ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        throw new AiCoreError("PROVIDER_TIMEOUT", "Le fournisseur IA n’a pas répondu à temps.", error);
      }
      throw new AiCoreError("EXECUTION_FAILED", "La génération OpenAI a échoué.", error);
    }
  }
}
