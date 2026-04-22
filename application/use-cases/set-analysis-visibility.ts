import type { Analysis } from "@/domain/entities/Analysis";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { canPublishAnalysis } from "@/domain/rules/analysis";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import {
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "../errors";

export interface SetAnalysisVisibilityInput {
  analysisId: string;
  requesterUserId: string | null;
  visibility: AnalysisVisibility | string;
}

export interface SetAnalysisVisibilityDeps {
  analysisRepository: AnalysisRepository;
}

function isAnalysisVisibility(value: string): value is AnalysisVisibility {
  return (Object.values(AnalysisVisibility) as string[]).includes(value);
}

export function makeSetAnalysisVisibility(deps: SetAnalysisVisibilityDeps) {
  return async function setAnalysisVisibility(
    input: SetAnalysisVisibilityInput
  ): Promise<Analysis> {
    if (!isAnalysisVisibility(input.visibility)) {
      throw new ValidationError(
        `Unsupported visibility: ${String(input.visibility)}`
      );
    }

    if (!input.requesterUserId) {
      throw new UnauthenticatedError("Authentication required.");
    }

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId !== input.requesterUserId) {
      throw new ForbiddenError(
        "Only the owner can change this analysis visibility."
      );
    }

    if (
      input.visibility === AnalysisVisibility.PUBLIC &&
      !canPublishAnalysis(analysis.status)
    ) {
      throw new ValidationError(
        "Only completed analyses can be published to the public library."
      );
    }

    const nextPublishedAt =
      input.visibility === AnalysisVisibility.PUBLIC
        ? (analysis.publishedAt ?? new Date())
        : null;

    return deps.analysisRepository.updateVisibilityState({
      id: analysis.id,
      visibility: input.visibility,
      publishedAt: nextPublishedAt,
    });
  };
}

export type SetAnalysisVisibility = ReturnType<typeof makeSetAnalysisVisibility>;
