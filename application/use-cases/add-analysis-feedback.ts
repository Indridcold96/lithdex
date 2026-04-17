import type { AnalysisFeedback } from "@/domain/entities/AnalysisFeedback";
import { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";
import type { AnalysisFeedbackRepository } from "@/domain/repositories/AnalysisFeedbackRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import { canReceiveCommunityFeedback } from "@/domain/rules/analysis";

import { NotFoundError, ValidationError } from "../errors";

export interface AddAnalysisFeedbackInput {
  analysisId: string;
  userId: string;
  type: AnalysisFeedbackType | string;
}

export interface AddAnalysisFeedbackDeps {
  analysisRepository: AnalysisRepository;
  analysisFeedbackRepository: AnalysisFeedbackRepository;
}

function isAnalysisFeedbackType(value: string): value is AnalysisFeedbackType {
  return (Object.values(AnalysisFeedbackType) as string[]).includes(value);
}

export function makeAddAnalysisFeedback(deps: AddAnalysisFeedbackDeps) {
  return async function addAnalysisFeedback(
    input: AddAnalysisFeedbackInput
  ): Promise<AnalysisFeedback> {
    if (!isAnalysisFeedbackType(input.type)) {
      throw new ValidationError(
        `Unsupported feedback type: ${String(input.type)}`
      );
    }

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (!canReceiveCommunityFeedback(analysis.visibility)) {
      throw new ValidationError(
        "This analysis is not open for community feedback."
      );
    }

    // Upsert respects the unique constraint on (analysisId, userId) and
    // naturally handles three cases without duplicating rows:
    //  - no existing feedback  -> create
    //  - existing same type    -> update to same type (effectively no-op)
    //  - existing opposite type -> update to new type
    return deps.analysisFeedbackRepository.upsert({
      analysisId: input.analysisId,
      userId: input.userId,
      type: input.type,
    });
  };
}

export type AddAnalysisFeedback = ReturnType<typeof makeAddAnalysisFeedback>;
