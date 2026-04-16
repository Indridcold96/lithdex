export const AnalysisInteractionRole = {
  ASSISTANT: "assistant",
  USER: "user",
  SYSTEM: "system",
} as const;

export type AnalysisInteractionRole =
  (typeof AnalysisInteractionRole)[keyof typeof AnalysisInteractionRole];
