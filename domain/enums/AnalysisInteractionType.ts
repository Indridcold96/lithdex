export const AnalysisInteractionType = {
  QUESTION: "question",
  ANSWER: "answer",
  INSTRUCTION: "instruction",
  REQUEST_IMAGE: "request_image",
  OBSERVATION: "observation",
} as const;

export type AnalysisInteractionType =
  (typeof AnalysisInteractionType)[keyof typeof AnalysisInteractionType];
