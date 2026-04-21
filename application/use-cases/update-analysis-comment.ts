import type { AnalysisComment } from "@/domain/entities/AnalysisComment";
import type { AnalysisCommentRepository } from "@/domain/repositories/AnalysisCommentRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import { canReceiveCommunityFeedback } from "@/domain/rules/analysis";

import {
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "../errors";

export interface UpdateAnalysisCommentInput {
  analysisId: string;
  commentId: string;
  actingUserId: string | null;
  content: string;
}

export interface UpdateAnalysisCommentDeps {
  analysisRepository: AnalysisRepository;
  analysisCommentRepository: AnalysisCommentRepository;
}

function requireExistingComment(
  comment: AnalysisComment | null,
  analysisId: string
): AnalysisComment {
  if (!comment || comment.analysisId !== analysisId) {
    throw new NotFoundError("Comment not found.");
  }

  return comment;
}

export function makeUpdateAnalysisComment(deps: UpdateAnalysisCommentDeps) {
  return async function updateAnalysisComment(
    input: UpdateAnalysisCommentInput
  ): Promise<AnalysisComment> {
    if (!input.actingUserId) {
      throw new UnauthenticatedError("Authentication required.");
    }

    const content = input.content.trim();
    if (content.length === 0) {
      throw new ValidationError("Comment content cannot be empty.");
    }

    const existingComment = await deps.analysisCommentRepository.findById(
      input.commentId
    );
    const comment = requireExistingComment(existingComment, input.analysisId);

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (!canReceiveCommunityFeedback(analysis.visibility)) {
      throw new ValidationError(
        "This analysis is not open for community comments."
      );
    }
    if (comment.userId !== input.actingUserId) {
      throw new ForbiddenError("You can only edit your own comments.");
    }

    return deps.analysisCommentRepository.updateContent(input.commentId, content);
  };
}

export type UpdateAnalysisComment = ReturnType<
  typeof makeUpdateAnalysisComment
>;
