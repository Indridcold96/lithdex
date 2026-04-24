import type { AnalysisTagSuggestionStatus } from "../enums/AnalysisTagSuggestionStatus";

import type { Tag } from "./Tag";

export interface AnalysisTagSuggestion {
  id: string;
  analysisId: string;
  tagId: string;
  suggestedByUserId: string;
  status: AnalysisTagSuggestionStatus;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tag: Tag;
}
