import type { Analysis } from "@/domain/entities/Analysis";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import { canSubmitAnalysis } from "@/domain/rules/analysis";

import { ValidationError } from "../errors";

export interface CreateAnalysisInput {
  userId?: string | null;
  title?: string | null;
  imageCount: number;
  visibility?: AnalysisVisibility;
}

export interface CreateAnalysisDeps {
  analysisRepository: AnalysisRepository;
}

export function makeCreateAnalysis(deps: CreateAnalysisDeps) {
  return async function createAnalysis(
    input: CreateAnalysisInput
  ): Promise<Analysis> {
    if (!canSubmitAnalysis(input.imageCount)) {
      throw new ValidationError(
        "An analysis requires at least 3 images before it can be submitted."
      );
    }

    return deps.analysisRepository.create({
      userId: input.userId ?? null,
      title: input.title ?? null,
      status: AnalysisStatus.SUBMITTED,
      visibility: input.visibility ?? AnalysisVisibility.PUBLIC,
      publishedAt: null,
    });
  };
}

export type CreateAnalysis = ReturnType<typeof makeCreateAnalysis>;
