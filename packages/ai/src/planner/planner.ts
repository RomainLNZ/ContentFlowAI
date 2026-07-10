import type { AiExecutionContext } from "../shared";

export type PlannedTask = {
  id: string;
  description: string;
  dependencies: readonly string[];
  preferredAgent?: string;
  expectedOutput: string;
};
export type ExecutionPlan = {
  objective: string;
  tasks: readonly PlannedTask[];
  strategy: "sequential" | "parallel" | "dag";
};
export type PlanningRequest = {
  objective: string;
  constraints: readonly string[];
  context: AiExecutionContext;
};

export interface Planner {
  plan(request: PlanningRequest): Promise<ExecutionPlan>;
}

export class SingleTaskPlanner implements Planner {
  async plan(request: PlanningRequest): Promise<ExecutionPlan> {
    return {
      objective: request.objective,
      strategy: "sequential",
      tasks: [
        {
          id: "task-1",
          description: request.objective,
          dependencies: [],
          expectedOutput: "Réponse complète à l’objectif",
        },
      ],
    };
  }
}
