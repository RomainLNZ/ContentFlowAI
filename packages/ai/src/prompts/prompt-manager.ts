import type { PromptSource, PromptTemplate, PromptVariables, RenderedPrompt } from "./prompt";

export class PromptManager {
  constructor(private readonly source: PromptSource) {}

  async render(key: string, variables: PromptVariables, version?: number): Promise<RenderedPrompt> {
    const template = await this.source.get(key, version);
    if (!template) throw new Error(`Prompt not found: ${key}${version ? `@${version}` : ""}`);
    const missing = template.requiredVariables.filter((name) => variables[name] === undefined);
    if (missing.length > 0) throw new Error(`Missing prompt variables: ${missing.join(", ")}`);
    return {
      key: template.key,
      version: template.version,
      system: this.interpolate(template.system, variables),
      user: this.interpolate(template.user, variables),
    };
  }

  private interpolate(value: string, variables: PromptVariables): string {
    return value.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (match, key: string) =>
      String(variables[key] ?? match),
    );
  }
}

export class InMemoryPromptSource implements PromptSource {
  constructor(private readonly templates: readonly PromptTemplate[]) {}
  async get(key: string, version?: number): Promise<PromptTemplate | null> {
    const matching = this.templates.filter(
      (item) => item.key === key && (version === undefined || item.version === version),
    );
    return matching.sort((a, b) => b.version - a.version)[0] ?? null;
  }
}
