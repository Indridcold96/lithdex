export const AnalysisFeedbackType = {
  CONFIRM: "confirm",
  DISPUTE: "dispute",
} as const;

export type AnalysisFeedbackType =
  (typeof AnalysisFeedbackType)[keyof typeof AnalysisFeedbackType];
