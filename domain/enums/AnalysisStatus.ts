export const AnalysisStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PROCESSING: "processing",
  NEEDS_FOLLOW_UP: "needs_follow_up",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type AnalysisStatus =
  (typeof AnalysisStatus)[keyof typeof AnalysisStatus];
