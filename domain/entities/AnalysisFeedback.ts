import type { AnalysisFeedbackType } from "../enums/AnalysisFeedbackType";

export interface AnalysisFeedback {
  id: string;
  analysisId: string;
  userId: string;
  type: AnalysisFeedbackType;
  createdAt: Date;
}
