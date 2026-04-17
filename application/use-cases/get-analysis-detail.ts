import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisCommentRepository } from "@/domain/repositories/AnalysisCommentRepository";
import type { AnalysisFeedbackRepository } from "@/domain/repositories/AnalysisFeedbackRepository";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { AnalysisResultRepository } from "@/domain/repositories/AnalysisResultRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { toAnalysisCommentDto } from "../dto/AnalysisCommentDto";
import type { AnalysisDetailDto } from "../dto/AnalysisDetailDto";
import { toAnalysisDto } from "../dto/AnalysisDto";
import { toAnalysisResultDto } from "../dto/AnalysisResultDto";
import { toPublicUserDto } from "../dto/AuthenticatedUserDto";
import { NotFoundError } from "../errors";

export interface GetAnalysisDetailInput {
  id: string;
  viewerUserId: string | null;
}

export interface GetAnalysisDetailDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
  analysisCommentRepository: AnalysisCommentRepository;
  analysisFeedbackRepository: AnalysisFeedbackRepository;
  analysisResultRepository: AnalysisResultRepository;
  userRepository: UserRepository;
}

export function makeGetAnalysisDetail(deps: GetAnalysisDetailDeps) {
  return async function getAnalysisDetail(
    input: GetAnalysisDetailInput
  ): Promise<AnalysisDetailDto> {
    const analysis = await deps.analysisRepository.findById(input.id);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.id}`);
    }

    // Visibility: private analyses are only visible to their owner.
    // Return 404-like behavior (NotFoundError) for everyone else to avoid
    // leaking the existence of private analyses.
    const isPrivate = analysis.visibility === AnalysisVisibility.PRIVATE;
    if (isPrivate && analysis.userId !== input.viewerUserId) {
      throw new NotFoundError(`Analysis not found: ${input.id}`);
    }

    const [images, comments, feedbackSummary, result] = await Promise.all([
      deps.analysisImageRepository.listByAnalysisId(analysis.id),
      deps.analysisCommentRepository.listByAnalysisId(analysis.id),
      deps.analysisFeedbackRepository.countByType(analysis.id),
      deps.analysisResultRepository.findByAnalysisId(analysis.id),
    ]);

    const authorIds = new Set<string>();
    for (const comment of comments) {
      authorIds.add(comment.userId);
    }
    if (analysis.userId) {
      authorIds.add(analysis.userId);
    }

    const participants = await deps.userRepository.listByIds(
      Array.from(authorIds)
    );
    const usersById = new Map(participants.map((user) => [user.id, user]));

    const owner = analysis.userId
      ? (usersById.get(analysis.userId) ?? null)
      : null;

    const commentDtos = comments.map((comment) =>
      toAnalysisCommentDto(comment, usersById.get(comment.userId) ?? null)
    );

    const viewerFeedback = input.viewerUserId
      ? await deps.analysisFeedbackRepository.findByAnalysisAndUser(
          analysis.id,
          input.viewerUserId
        )
      : null;

    const base = toAnalysisDto(analysis, images);

    return {
      ...base,
      owner: owner ? toPublicUserDto(owner) : null,
      result: result ? toAnalysisResultDto(result) : null,
      comments: commentDtos,
      feedbackSummary: {
        confirmCount: feedbackSummary.confirm,
        disputeCount: feedbackSummary.dispute,
      },
      viewerFeedback: viewerFeedback ? viewerFeedback.type : null,
    };
  };
}

export type GetAnalysisDetail = ReturnType<typeof makeGetAnalysisDetail>;
