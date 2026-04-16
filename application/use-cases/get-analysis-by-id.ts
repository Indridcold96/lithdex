import type { Analysis } from "@/domain/entities/Analysis";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import { NotFoundError } from "../errors";

export interface GetAnalysisByIdDeps {
  analysisRepository: AnalysisRepository;
}

export function makeGetAnalysisById(deps: GetAnalysisByIdDeps) {
  return async function getAnalysisById(id: string): Promise<Analysis> {
    const analysis = await deps.analysisRepository.findById(id);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${id}`);
    }
    return analysis;
  };
}

export type GetAnalysisById = ReturnType<typeof makeGetAnalysisById>;
