import type { ProviderDescriptor } from "./provider";

export const providerManifests = [
  {
    id: "openai",
    displayName: "OpenAI",
    capabilities: ["text", "vision", "tools", "json", "embeddings", "streaming"],
    status: "planned",
    configurationKeys: ["OPENAI_API_KEY"],
  },
  {
    id: "anthropic",
    displayName: "Anthropic",
    capabilities: ["text", "vision", "tools", "streaming"],
    status: "planned",
    configurationKeys: ["ANTHROPIC_API_KEY"],
  },
  {
    id: "google-gemini",
    displayName: "Google Gemini",
    capabilities: ["text", "vision", "tools", "json", "embeddings", "streaming"],
    status: "planned",
    configurationKeys: ["GOOGLE_AI_API_KEY"],
  },
  {
    id: "mistral",
    displayName: "Mistral AI",
    capabilities: ["text", "vision", "tools", "json", "embeddings", "streaming"],
    status: "planned",
    configurationKeys: ["MISTRAL_API_KEY"],
  },
  {
    id: "deepseek",
    displayName: "DeepSeek",
    capabilities: ["text", "tools", "json", "streaming"],
    status: "planned",
    configurationKeys: ["DEEPSEEK_API_KEY"],
  },
  {
    id: "ollama",
    displayName: "Ollama",
    capabilities: ["text", "vision", "tools", "embeddings", "streaming"],
    status: "planned",
    configurationKeys: ["OLLAMA_BASE_URL"],
  },
] as const satisfies readonly ProviderDescriptor[];

export function declareKnownProviders(registry: { declare(descriptor: ProviderDescriptor): void }): void {
  for (const descriptor of providerManifests) registry.declare(descriptor);
}
