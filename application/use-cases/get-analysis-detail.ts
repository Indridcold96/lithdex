import { isPubliclyVisibleInteractionType } from "@/domain/enums/AnalysisInteractionType";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisCommentRepository } from "@/domain/repositories/AnalysisCommentRepository";
import type { AnalysisFeedbackRepository } from "@/domain/repositories/AnalysisFeedbackRepository";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisInteractionRepository } from "@/domain/repositories/AnalysisInteractionRepository";
import type { AnalysisTagRepository } from "@/domain/repositories/AnalysisTagRepository";
import type { AnalysisTagSuggestionRepository } from "@/domain/repositories/AnalysisTagSuggestionRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { AnalysisResultRepository } from "@/domain/repositories/AnalysisResultRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { toAnalysisCommentDto } from "../dto/AnalysisCommentDto";
import type { AnalysisDetailDto } from "../dto/AnalysisDetailDto";
import { toAnalysisDto } from "../dto/AnalysisDto";
import { toAnalysisInteractionDto } from "../dto/AnalysisInteractionDto";
import { toAnalysisResultDto } from "../dto/AnalysisResultDto";
import { toAnalysisTagDto } from "../dto/AnalysisTagDto";
import { toAnalysisTagSuggestionDto } from "../dto/AnalysisTagSuggestionDto";
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
  analysisInteractionRepository: AnalysisInteractionRepository;
  analysisTagRepository: AnalysisTagRepository;
  analysisTagSuggestionRepository: AnalysisTagSuggestionRepository;
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

    const isPrivate = analysis.visibility === AnalysisVisibility.PRIVATE;
    if (isPrivate && analysis.userId !== input.viewerUserId) {
      throw new NotFoundError(`Analysis not found: ${input.id}`);
    }

    const isOwner = analysis.userId !== null && analysis.userId === input.viewerUserId;

    const [
      images,
      comments,
      feedbackSummary,
      result,
      interactions,
      tags,
      pendingSuggestions,
    ] =
      await Promise.all([
        deps.analysisImageRepository.listByAnalysisId(analysis.id),
        deps.analysisCommentRepository.listByAnalysisId(analysis.id),
        deps.analysisFeedbackRepository.countByType(analysis.id),
        deps.analysisResultRepository.findByAnalysisId(analysis.id),
        deps.analysisInteractionRepository.listByAnalysisId(analysis.id),
        deps.analysisTagRepository.listByAnalysisId(analysis.id),
        isOwner
          ? deps.analysisTagSuggestionRepository.listPendingByAnalysisId(
              analysis.id
            )
          : Promise.resolve([]),
      ]);

    const authorIds = new Set<string>();
    for (const comment of comments) {
      authorIds.add(comment.userId);
    }
    if (analysis.userId) {
      authorIds.add(analysis.userId);
    }
    for (const suggestion of pendingSuggestions) {
      authorIds.add(suggestion.suggestedByUserId);
    }

    const participants = await deps.userRepository.listByIds(
      Array.from(authorIds)
    );
    const usersById = new Map(participants.map((user) => [user.id, user]));

    const owner = analysis.userId
      ? (usersById.get(analysis.userId) ?? null)
      : null;

    const commentDtos = comments.map((comment) =>
      toAnalysisCommentDto(
        comment,
        usersById.get(comment.userId) ?? null,
        input.viewerUserId
      )
    );

    const viewerFeedback = input.viewerUserId
      ? await deps.analysisFeedbackRepository.findByAnalysisAndUser(
          analysis.id,
          input.viewerUserId
        )
      : null;

    // Only surface meaningful user-facing interactions on the detail DTO.
    // System rows and raw upload events stay out of the public view.
    const publicInteractions = interactions
      .filter((interaction) =>
        isPubliclyVisibleInteractionType(interaction.interactionType)
      )
      .map(toAnalysisInteractionDto);

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
      tags: tags.map(toAnalysisTagDto),
      pendingTagSuggestions: pendingSuggestions.map((suggestion) => {
        const suggestedBy = usersById.get(suggestion.suggestedByUserId);
        return toAnalysisTagSuggestionDto(
          suggestion,
          suggestedBy ? toPublicUserDto(suggestedBy) : null
        );
      }),
      interactions: publicInteractions,
    };
  };
}

export type GetAnalysisDetail = ReturnType<typeof makeGetAnalysisDetail>;
