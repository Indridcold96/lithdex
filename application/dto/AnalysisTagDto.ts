import type { AnalysisTag } from "@/domain/entities/AnalysisTag";

export interface AnalysisTagDto {
  id: string;
  name: string;
  slug: string;
}

export function toAnalysisTagDto(tag: AnalysisTag): AnalysisTagDto {
  return {
    id: tag.tag.id,
    name: tag.tag.name,
    slug: tag.tag.slug,
  };
}
