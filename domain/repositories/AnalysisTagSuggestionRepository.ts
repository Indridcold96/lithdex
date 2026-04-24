import type { AnalysisTagSuggestion } from "../entities/AnalysisTagSuggestion";
import type { AnalysisTagSuggestionStatus } from "../enums/AnalysisTagSuggestionStatus";

export interface CreateAnalysisTagSuggestionData {
  analysisId: string;
  tagId: string;
  suggestedByUserId: string;
  status: AnalysisTagSuggestionStatus;
}

export interface ReviewAnalysisTagSuggestionData {
  id: string;
  status: AnalysisTagSuggestionStatus;
  reviewedByUserId: string;
  reviewedAt: Date;
}

export interface AnalysisTagSuggestionRepository {
  create(data: CreateAnalysisTagSuggestionData): Promise<AnalysisTagSuggestion>;
  findById(id: string): Promise<AnalysisTagSuggestion | null>;
  findPendingByAnalysisAndTag(
    analysisId: string,
    tagId: string
  ): Promise<AnalysisTagSuggestion | null>;
  findLatestByAnalysisAndTag(
    analysisId: string,
    tagId: string
  ): Promise<AnalysisTagSuggestion | null>;
  listPendingByAnalysisId(analysisId: string): Promise<AnalysisTagSuggestion[]>;
  review(data: ReviewAnalysisTagSuggestionData): Promise<AnalysisTagSuggestion>;
}
