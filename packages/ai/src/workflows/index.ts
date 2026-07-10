export type WorkflowStatus = "pending" | "running" | "waiting" | "completed" | "failed" | "cancelled";
export type WorkflowContext = {
  workflowId: string;
  organizationId: string;
  workspaceId: string;
  correlationId: string;
  state: Readonly<Record<string, unknown>>;
};
export type WorkflowResult = { status: WorkflowStatus; output?: unknown; errorCode?: string };

export interface AiWorkflow<TInput = unknown> {
  readonly key: string;
  run(input: TInput, context: WorkflowContext): Promise<WorkflowResult>;
}
