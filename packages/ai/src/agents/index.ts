import type { AiExecutionContext, ModelSettings } from "../shared";
import type { AiTool } from "../tools";

export type AgentDefinition = {
  key: string;
  name: string;
  description: string;
  prompt: { key: string; version: number };
  providerId: string;
  model: ModelSettings;
  tools: readonly AiTool[];
};
export interface Agent {
  readonly definition: AgentDefinition;
  canHandle(task: string, context: AiExecutionContext): Promise<boolean>;
}
export interface AgentRegistry {
  register(agent: Agent): void;
  get(key: string): Agent | undefined;
  list(): readonly Agent[];
}
export interface AgentRouter {
  resolve(
    task: string,
    context: AiExecutionContext,
    preferredAgent?: string,
  ): Promise<AgentDefinition | null>;
}
export * from "./social-content-agent";
