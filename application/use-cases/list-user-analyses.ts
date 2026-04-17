import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type {
  AnalysisRepository,
  ListUserAnalysesOptions,
} from "@/domain/repositories/AnalysisRepository";

import { toAnalysisDto, type AnalysisDto } from "../dto/AnalysisDto";

export interface ListUserAnalysesInput extends ListUserAnalysesOptions {
  userId: string;
}

export interface ListUserAnalysesDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
}

export function makeListUserAnalyses(deps: ListUserAnalysesDeps) {
  return async function listUserAnalyses(
    input: ListUserAnalysesInput
  ): Promise<AnalysisDto[]> {
    const { userId, ...options } = input;
    const analyses = await deps.analysisRepository.listByUserId(
      userId,
      options
    );

    return Promise.all(
      analyses.map(async (analysis) => {
        const images = await deps.analysisImageRepository.listByAnalysisId(
          analysis.id
        );
        return toAnalysisDto(analysis, images);
      })
    );
  };
}

export type ListUserAnalyses = ReturnType<typeof makeListUserAnalyses>;
