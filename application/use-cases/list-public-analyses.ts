import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisTagRepository } from "@/domain/repositories/AnalysisTagRepository";
import type {
  AnalysisRepository,
  ListPublicAnalysesOptions,
} from "@/domain/repositories/AnalysisRepository";

import { toAnalysisDto } from "../dto/AnalysisDto";
import type { PublicAnalysesPageDto } from "../dto/PublicAnalysesPageDto";
import { ValidationError } from "../errors";

export type ListPublicAnalysesInput = ListPublicAnalysesOptions;

export const MAX_PUBLIC_ANALYSES_SEARCH_QUERY_LENGTH = 80;

export interface ListPublicAnalysesDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
  analysisTagRepository: AnalysisTagRepository;
}

function normalizeSearchQuery(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return undefined;
  }
  if (normalized.length > MAX_PUBLIC_ANALYSES_SEARCH_QUERY_LENGTH) {
    throw new ValidationError(
      `Search query must be ${MAX_PUBLIC_ANALYSES_SEARCH_QUERY_LENGTH} characters or fewer.`
    );
  }

  return normalized;
}

export function makeListPublicAnalyses(deps: ListPublicAnalysesDeps) {
  return async function listPublicAnalyses(
    input: ListPublicAnalysesInput = {}
  ): Promise<PublicAnalysesPageDto> {
    const searchQuery = normalizeSearchQuery(input.searchQuery);
    const page = await deps.analysisRepository.listPublic({
      limit: input.limit,
      cursor: input.cursor,
      searchQuery,
    });
    const analysisIds = page.items.map((analysis) => analysis.id);
    const [images, tags] = await Promise.all([
      deps.analysisImageRepository.listByAnalysisIds(analysisIds),
      deps.analysisTagRepository.listByAnalysisIds(analysisIds),
    ]);
    const imagesByAnalysisId = new Map<string, typeof images>();
    const tagsByAnalysisId = new Map<string, typeof tags>();

    for (const image of images) {
      const existing = imagesByAnalysisId.get(image.analysisId);
      if (existing) {
        existing.push(image);
      } else {
        imagesByAnalysisId.set(image.analysisId, [image]);
      }
    }

    for (const tag of tags) {
      const existing = tagsByAnalysisId.get(tag.analysisId);
      if (existing) {
        existing.push(tag);
      } else {
        tagsByAnalysisId.set(tag.analysisId, [tag]);
      }
    }

    const items = page.items.map((analysis) =>
      toAnalysisDto(
        analysis,
        imagesByAnalysisId.get(analysis.id) ?? [],
        tagsByAnalysisId.get(analysis.id) ?? []
      )
    );

    return {
      items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  };
}

export type ListPublicAnalyses = ReturnType<typeof makeListPublicAnalyses>;
