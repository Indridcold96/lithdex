import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type {
  AnalysisRepository,
  ListPublicAnalysesOptions,
} from "@/domain/repositories/AnalysisRepository";

import { toAnalysisDto } from "../dto/AnalysisDto";
import type { PublicAnalysesPageDto } from "../dto/PublicAnalysesPageDto";

export type ListPublicAnalysesInput = ListPublicAnalysesOptions;

export interface ListPublicAnalysesDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
}

export function makeListPublicAnalyses(deps: ListPublicAnalysesDeps) {
  return async function listPublicAnalyses(
    input: ListPublicAnalysesInput = {}
  ): Promise<PublicAnalysesPageDto> {
    const page = await deps.analysisRepository.listPublic(input);
    const analysisIds = page.items.map((analysis) => analysis.id);
    const images = await deps.analysisImageRepository.listByAnalysisIds(
      analysisIds
    );
    const imagesByAnalysisId = new Map<string, typeof images>();

    for (const image of images) {
      const existing = imagesByAnalysisId.get(image.analysisId);
      if (existing) {
        existing.push(image);
      } else {
        imagesByAnalysisId.set(image.analysisId, [image]);
      }
    }

    const items = page.items.map((analysis) =>
      toAnalysisDto(analysis, imagesByAnalysisId.get(analysis.id) ?? [])
    );

    return {
      items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  };
}

export type ListPublicAnalyses = ReturnType<typeof makeListPublicAnalyses>;
