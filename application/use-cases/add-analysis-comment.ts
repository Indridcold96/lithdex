import type { AnalysisComment } from "@/domain/entities/AnalysisComment";
import type { AnalysisCommentRepository } from "@/domain/repositories/AnalysisCommentRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import { canReceiveCommunityFeedback } from "@/domain/rules/analysis";

import { NotFoundError, ValidationError } from "../errors";

export interface AddAnalysisCommentInput {
  analysisId: string;
  userId: string;
  content: string;
}

export interface AddAnalysisCommentDeps {
  analysisRepository: AnalysisRepository;
  analysisCommentRepository: AnalysisCommentRepository;
}

export function makeAddAnalysisComment(deps: AddAnalysisCommentDeps) {
  return async function addAnalysisComment(
    input: AddAnalysisCommentInput
  ): Promise<AnalysisComment> {
    const content = input.content.trim();
    if (content.length === 0) {
      throw new ValidationError("Comment content cannot be empty.");
    }

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (!canReceiveCommunityFeedback(analysis.visibility)) {
      throw new ValidationError(
        "This analysis is not open for community comments."
      );
    }

    return deps.analysisCommentRepository.create({
      analysisId: input.analysisId,
      userId: input.userId,
      content,
    });
  };
}

export type AddAnalysisComment = ReturnType<typeof makeAddAnalysisComment>;
