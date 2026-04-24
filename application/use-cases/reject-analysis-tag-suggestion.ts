import { AnalysisTagSuggestionStatus } from "@/domain/enums/AnalysisTagSuggestionStatus";
import type { AnalysisTagSuggestionRepository } from "@/domain/repositories/AnalysisTagSuggestionRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors";

export interface RejectAnalysisTagSuggestionInput {
  analysisId: string;
  suggestionId: string;
  reviewerUserId: string;
}

export interface RejectAnalysisTagSuggestionDeps {
  analysisRepository: AnalysisRepository;
  analysisTagSuggestionRepository: AnalysisTagSuggestionRepository;
}

export function makeRejectAnalysisTagSuggestion(
  deps: RejectAnalysisTagSuggestionDeps
) {
  return async function rejectAnalysisTagSuggestion(
    input: RejectAnalysisTagSuggestionInput
  ) {
    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId !== input.reviewerUserId) {
      throw new ForbiddenError(
        "Only the owner can review tag suggestions on this analysis."
      );
    }

    const suggestion = await deps.analysisTagSuggestionRepository.findById(
      input.suggestionId
    );
    if (!suggestion || suggestion.analysisId !== analysis.id) {
      throw new NotFoundError(
        `Tag suggestion not found: ${input.suggestionId}`
      );
    }
    if (suggestion.status !== AnalysisTagSuggestionStatus.PENDING) {
      throw new ConflictError("Only pending tag suggestions can be rejected.");
    }

    return deps.analysisTagSuggestionRepository.review({
      id: suggestion.id,
      status: AnalysisTagSuggestionStatus.REJECTED,
      reviewedByUserId: input.reviewerUserId,
      reviewedAt: new Date(),
    });
  };
}

export type RejectAnalysisTagSuggestion = ReturnType<
  typeof makeRejectAnalysisTagSuggestion
>;
