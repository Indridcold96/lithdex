import type { AnalysisTagSuggestion } from "@/domain/entities/AnalysisTagSuggestion";

import type { PublicUserDto } from "./AuthenticatedUserDto";
import type { AnalysisTagDto } from "./AnalysisTagDto";

export interface AnalysisTagSuggestionDto {
  id: string;
  tag: AnalysisTagDto;
  suggestedBy: PublicUserDto | null;
  createdAt: Date;
  status: AnalysisTagSuggestion["status"];
}

export function toAnalysisTagSuggestionDto(
  suggestion: AnalysisTagSuggestion,
  suggestedBy: PublicUserDto | null
): AnalysisTagSuggestionDto {
  return {
    id: suggestion.id,
    tag: {
      id: suggestion.tag.id,
      name: suggestion.tag.name,
      slug: suggestion.tag.slug,
    },
    suggestedBy,
    createdAt: suggestion.createdAt,
    status: suggestion.status,
  };
}
