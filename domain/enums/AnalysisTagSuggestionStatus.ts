export const AnalysisTagSuggestionStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export type AnalysisTagSuggestionStatus =
  (typeof AnalysisTagSuggestionStatus)[keyof typeof AnalysisTagSuggestionStatus];
