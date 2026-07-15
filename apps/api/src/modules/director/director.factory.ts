import { selectAiProvider } from "@flowpilot/ai";
import { DirectorOrchestrator } from "./director-orchestrator.js";

export type DirectorConfiguration = {
  openAiApiKey?: string;
  model: string;
  timeoutMs: number;
};

export function createDirectorOrchestrator(configuration: DirectorConfiguration): DirectorOrchestrator {
  const provider = selectAiProvider({
    ...(configuration.openAiApiKey ? { openAiApiKey: configuration.openAiApiKey } : {}),
    timeoutMs: configuration.timeoutMs,
  });
  return new DirectorOrchestrator(provider, configuration.model);
}
