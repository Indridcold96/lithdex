export const AnalysisVisibility = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export type AnalysisVisibility =
  (typeof AnalysisVisibility)[keyof typeof AnalysisVisibility];
