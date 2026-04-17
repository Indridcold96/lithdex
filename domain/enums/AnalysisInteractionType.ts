// A disciplined taxonomy for interaction rows. Every new assistant or user
// action during the guided analysis flow must map to one of these types.
// `metadataJson` carries the structured payload for that type.
export const AnalysisInteractionType = {
  // The AI asked the user to supply additional images of specific kinds.
  // metadataJson: { requestedImageTypes: string[], rationale?: string }
  ASSISTANT_FOLLOWUP_REQUEST: "assistant_followup_request",

  // The AI asked a constrained, structured question (optionally with options).
  // metadataJson: { questions: Array<{ id: string; prompt: string; options?: string[] }>, rationale?: string }
  ASSISTANT_QUESTION: "assistant_question",

  // The AI produced a preliminary assessment that is NOT final yet.
  // metadataJson: { summary: string, confidence?: number | null }
  ASSISTANT_PRELIMINARY_ASSESSMENT: "assistant_preliminary_assessment",

  // The AI produced the final summary backing the final AnalysisResult row.
  // metadataJson: { summary: string, confidence?: number | null, inconclusive?: boolean, reason?: string }
  ASSISTANT_FINAL_SUMMARY: "assistant_final_summary",

  // The user answered one or more constrained assistant questions.
  // metadataJson: { answers: Array<{ questionId: string; answer: string }>, answeredAt: string }
  USER_FOLLOWUP_ANSWER: "user_followup_answer",

  // The user uploaded more images in response to an assistant follow-up request.
  // metadataJson: { imageIds: string[], count: number }
  USER_FOLLOWUP_UPLOAD: "user_followup_upload",

  // System-only telemetry: lifecycle, provider errors, etc. Never shown publicly.
  // metadataJson: { event: string, detail?: unknown }
  SYSTEM_STATUS: "system_status",
} as const;

export type AnalysisInteractionType =
  (typeof AnalysisInteractionType)[keyof typeof AnalysisInteractionType];

const PUBLIC_INTERACTION_TYPES = new Set<AnalysisInteractionType>([
  AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST,
  AnalysisInteractionType.ASSISTANT_QUESTION,
  AnalysisInteractionType.ASSISTANT_PRELIMINARY_ASSESSMENT,
  AnalysisInteractionType.ASSISTANT_FINAL_SUMMARY,
  AnalysisInteractionType.USER_FOLLOWUP_ANSWER,
]);

// Interactions that are safe to render on a public analysis detail page.
// System noise and raw upload events are intentionally excluded.
export function isPubliclyVisibleInteractionType(
  value: AnalysisInteractionType | string
): value is AnalysisInteractionType {
  return PUBLIC_INTERACTION_TYPES.has(value as AnalysisInteractionType);
}
