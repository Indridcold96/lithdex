import { AnalysisTagSuggestionStatus } from "@/domain/enums/AnalysisTagSuggestionStatus";
import type { AnalysisTagSuggestionRepository } from "@/domain/repositories/AnalysisTagSuggestionRepository";
import type { AnalysisTagRepository } from "@/domain/repositories/AnalysisTagRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { TagRepository } from "@/domain/repositories/TagRepository";
import { canReceiveCommunityFeedback } from "@/domain/rules/analysis";

import { normalizeCanonicalTag } from "./tags/normalize-canonical-tag";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors";

export interface SuggestAnalysisTagInput {
  analysisId: string;
  userId: string;
  tag: string;
}

export interface SuggestAnalysisTagDeps {
  analysisRepository: AnalysisRepository;
  analysisTagRepository: AnalysisTagRepository;
  analysisTagSuggestionRepository: AnalysisTagSuggestionRepository;
  tagRepository: TagRepository;
}

export function makeSuggestAnalysisTag(deps: SuggestAnalysisTagDeps) {
  return async function suggestAnalysisTag(
    input: SuggestAnalysisTagInput
  ) {
    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId === input.userId) {
      throw new ForbiddenError(
        "Use tag review to manage your own analysis tags."
      );
    }
    if (!canReceiveCommunityFeedback(analysis.visibility)) {
      throw new ValidationError(
        "This analysis is not open for tag suggestions."
      );
    }

    const normalized = normalizeCanonicalTag(input.tag);
    if (!normalized) {
      throw new ValidationError("Provide a short, valid tag suggestion.");
    }

    const canonical =
      (await deps.tagRepository.findBySlug(normalized.slug)) ??
      (await deps.tagRepository.create(normalized));

    const appliedTags = await deps.analysisTagRepository.listByAnalysisId(
      analysis.id
    );
    if (appliedTags.some((tag) => tag.tag.slug === canonical.slug)) {
      throw new ConflictError("This tag is already applied to the analysis.");
    }

    const pendingSuggestion =
      await deps.analysisTagSuggestionRepository.findPendingByAnalysisAndTag(
        analysis.id,
        canonical.id
      );
    if (pendingSuggestion) {
      throw new ConflictError("This tag is already pending review.");
    }

    const latestSuggestion =
      await deps.analysisTagSuggestionRepository.findLatestByAnalysisAndTag(
        analysis.id,
        canonical.id
      );
    if (latestSuggestion) {
      throw new ConflictError(
        "This tag has already been suggested for this analysis."
      );
    }

    return deps.analysisTagSuggestionRepository.create({
      analysisId: analysis.id,
      tagId: canonical.id,
      suggestedByUserId: input.userId,
      status: AnalysisTagSuggestionStatus.PENDING,
    });
  };
}

export type SuggestAnalysisTag = ReturnType<typeof makeSuggestAnalysisTag>;
