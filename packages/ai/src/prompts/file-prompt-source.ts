import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PromptSource, PromptTemplate } from "./prompt";

export class FilePromptSource implements PromptSource {
  constructor(private readonly catalogDirectory: string) {}

  async get(key: string, version?: number): Promise<PromptTemplate | null> {
    if (!version)
      throw new Error("FilePromptSource requires an explicit prompt version in production executions.");
    if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(key)) throw new Error(`Invalid prompt key: ${key}`);
    if (!Number.isSafeInteger(version) || version < 1) throw new Error(`Invalid prompt version: ${version}`);
    try {
      const path = join(this.catalogDirectory, ...key.split("."), `v${version}.json`);
      return JSON.parse(await readFile(path, "utf8")) as PromptTemplate;
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String(error.code) : "";
      if (code === "ENOENT") return null;
      throw error;
    }
  }
}
