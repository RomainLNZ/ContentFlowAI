export type ToolExecutionContext = {
  organizationId: string;
  workspaceId: string;
  userId: string;
  correlationId: string;
};
export type ToolResult = { content: unknown; metadata?: Readonly<Record<string, unknown>> };

export interface AiTool<TInput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  execute(input: TInput, context: ToolExecutionContext): Promise<ToolResult>;
}
