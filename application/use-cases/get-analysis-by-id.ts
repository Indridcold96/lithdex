import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import { toAnalysisDto, type AnalysisDto } from "../dto/AnalysisDto";
import { NotFoundError } from "../errors";

export interface GetAnalysisByIdInput {
  id: string;
  viewerUserId: string | null;
}

export interface GetAnalysisByIdDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
}

export function makeGetAnalysisById(deps: GetAnalysisByIdDeps) {
  return async function getAnalysisById(
    input: GetAnalysisByIdInput
  ): Promise<AnalysisDto> {
    const analysis = await deps.analysisRepository.findById(input.id);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.id}`);
    }

    if (
      analysis.visibility === AnalysisVisibility.PRIVATE &&
      analysis.userId !== input.viewerUserId
    ) {
      throw new NotFoundError(`Analysis not found: ${input.id}`);
    }

    const images = await deps.analysisImageRepository.listByAnalysisId(
      analysis.id
    );
    return toAnalysisDto(analysis, images);
  };
}

export type GetAnalysisById = ReturnType<typeof makeGetAnalysisById>;
