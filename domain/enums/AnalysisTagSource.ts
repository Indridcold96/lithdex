export const AnalysisTagSource = {
  SYSTEM: "system",
  SUGGESTION: "suggestion",
} as const;

export type AnalysisTagSource =
  (typeof AnalysisTagSource)[keyof typeof AnalysisTagSource];
