import { AnalysisTagSource } from "@/domain/enums/AnalysisTagSource";
import { AnalysisTagSuggestionStatus } from "@/domain/enums/AnalysisTagSuggestionStatus";
import type { AnalysisTagSuggestionRepository } from "@/domain/repositories/AnalysisTagSuggestionRepository";
import type { AnalysisTagRepository } from "@/domain/repositories/AnalysisTagRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors";

export interface AcceptAnalysisTagSuggestionInput {
  analysisId: string;
  suggestionId: string;
  reviewerUserId: string;
}

export interface AcceptAnalysisTagSuggestionDeps {
  analysisRepository: AnalysisRepository;
  analysisTagRepository: AnalysisTagRepository;
  analysisTagSuggestionRepository: AnalysisTagSuggestionRepository;
}

export function makeAcceptAnalysisTagSuggestion(
  deps: AcceptAnalysisTagSuggestionDeps
) {
  return async function acceptAnalysisTagSuggestion(
    input: AcceptAnalysisTagSuggestionInput
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
      throw new ConflictError("Only pending tag suggestions can be accepted.");
    }

    const appliedTag = await deps.analysisTagRepository.attach({
      analysisId: analysis.id,
      tagId: suggestion.tagId,
      sourceType: AnalysisTagSource.SUGGESTION,
    });

    const reviewedSuggestion = await deps.analysisTagSuggestionRepository.review({
      id: suggestion.id,
      status: AnalysisTagSuggestionStatus.ACCEPTED,
      reviewedByUserId: input.reviewerUserId,
      reviewedAt: new Date(),
    });

    return {
      suggestion: reviewedSuggestion,
      appliedTag,
    };
  };
}

export type AcceptAnalysisTagSuggestion = ReturnType<
  typeof makeAcceptAnalysisTagSuggestion
>;
