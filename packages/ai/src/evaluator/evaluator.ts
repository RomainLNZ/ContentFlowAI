import type { AiExecutionContext } from "../shared";

export type EvaluationCriterion = { key: string; label: string; weight: number };
export type EvaluationScore = { criterion: string; score: number; explanation?: string };
export type EvaluationRequest = {
  objective: string;
  output: string;
  context: AiExecutionContext;
  criteria: readonly EvaluationCriterion[];
};
export type EvaluationResult = {
  passed: boolean;
  overallScore: number;
  scores: readonly EvaluationScore[];
  suggestions: readonly string[];
};

export interface ResponseEvaluator {
  evaluate(request: EvaluationRequest): Promise<EvaluationResult>;
}

export class PassThroughEvaluator implements ResponseEvaluator {
  async evaluate(): Promise<EvaluationResult> {
    return { passed: true, overallScore: 1, scores: [], suggestions: [] };
  }
}
