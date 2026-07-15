import { AiCoreError, type ModelRequest, type ModelResponse } from "../shared";
import type { AiProvider } from "./provider";
import { buildMockDirectorResponse } from "./mock-director-response";

type JsonSchema = Readonly<Record<string, unknown>>;

function materialize(schema: JsonSchema, propertyName = "value"): unknown {
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
  if (schema.const !== undefined) return schema.const;

  switch (schema.type) {
    case "object": {
      const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
      return Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [key, materialize(value, key)]),
      );
    }
    case "array": {
      const count = Number(schema.minItems ?? schema.maxItems ?? 1);
      const itemSchema = (schema.items ?? { type: "string" }) as JsonSchema;
      return Array.from({ length: Math.max(0, count) }, () => materialize(itemSchema, propertyName));
    }
    case "number":
    case "integer":
      return Number(schema.minimum ?? 0);
    case "boolean":
      return true;
    case "null":
      return null;
    default:
      return `Mock ${propertyName}`;
  }
}

export class MockProvider implements AiProvider {
  readonly descriptor = {
    id: "mock",
    displayName: "Mock déterministe",
    capabilities: ["text", "json"] as const,
    status: "available" as const,
    configurationKeys: [] as const,
  };

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(request: ModelRequest, signal?: AbortSignal): Promise<ModelResponse> {
    if (signal?.aborted) throw new AiCoreError("PROVIDER_TIMEOUT", "La génération simulée a été annulée.");

    const directorSnapshot =
      request.structuredOutput?.name === "director_recommendations"
        ? (JSON.parse(request.messages.at(-1)?.content ?? "{}") as Record<string, unknown>)
        : null;
    const content = directorSnapshot
      ? JSON.stringify(buildMockDirectorResponse(directorSnapshot))
      : request.structuredOutput
        ? JSON.stringify(materialize(request.structuredOutput.schema))
        : `Réponse simulée déterministe : ${request.messages.at(-1)?.content ?? "sans contenu"}`;
    const input = request.messages.reduce((total, message) => total + message.content.length, 0);
    const output = content.length;

    return {
      content,
      model: request.settings.model || "mock-v1",
      providerRequestId: "mock-deterministic",
      finishReason: "completed",
      usage: { input, output, total: input + output },
      raw: { simulated: true },
    };
  }
}
