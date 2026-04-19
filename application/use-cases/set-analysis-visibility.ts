import type { Analysis } from "@/domain/entities/Analysis";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { shouldPublishAnalysis } from "@/domain/rules/analysis";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import { ValidationError } from "../errors";

export interface SetAnalysisVisibilityInput {
  analysisId: string;
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

    const analysis = await deps.analysisRepository.updateVisibility(
      input.analysisId,
      input.visibility
    );

    if (!shouldPublishAnalysis(analysis)) {
      return analysis;
    }

    return deps.analysisRepository.setPublishedAt(analysis.id, new Date());
  };
}

export type SetAnalysisVisibility = ReturnType<typeof makeSetAnalysisVisibility>;
