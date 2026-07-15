import { MockProvider } from "./mock.provider";
import { OpenAiProvider } from "./openai.provider";
import type { AiProvider } from "./provider";

export type ProviderSelectionOptions = {
  openAiApiKey?: string;
  timeoutMs?: number;
};

export function selectAiProvider(options: ProviderSelectionOptions): AiProvider {
  return options.openAiApiKey
    ? new OpenAiProvider({
        apiKey: options.openAiApiKey,
        ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
      })
    : new MockProvider();
}
