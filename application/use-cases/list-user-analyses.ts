import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type {
  AnalysisRepository,
  ListUserAnalysesOptions,
} from "@/domain/repositories/AnalysisRepository";

import { toAnalysisDto, type AnalysisDto } from "../dto/AnalysisDto";
import type { UserAnalysesPageDto } from "../dto/UserAnalysesPageDto";

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
  ): Promise<UserAnalysesPageDto> {
    const { userId, ...options } = input;
    const [page, counts] = await Promise.all([
      deps.analysisRepository.listByUserId(userId, options),
      deps.analysisRepository.countByUserId(userId),
    ]);
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

    const items: AnalysisDto[] = page.items.map((analysis) =>
      toAnalysisDto(
        analysis,
        imagesByAnalysisId.get(analysis.id) ?? []
      )
    );

    return {
      items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      counts,
    };
  };
}

export type ListUserAnalyses = ReturnType<typeof makeListUserAnalyses>;
