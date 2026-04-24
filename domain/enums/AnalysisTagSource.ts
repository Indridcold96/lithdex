export const AnalysisTagSource = {
  SYSTEM: "system",
} as const;

export type AnalysisTagSource =
  (typeof AnalysisTagSource)[keyof typeof AnalysisTagSource];
