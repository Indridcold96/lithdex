import type { AnalysisFeedback } from "../entities/AnalysisFeedback";
import type { AnalysisFeedbackType } from "../enums/AnalysisFeedbackType";

export interface CreateAnalysisFeedbackData {
  analysisId: string;
  userId: string;
  type: AnalysisFeedbackType;
}

export interface AnalysisFeedbackCounts {
  confirm: number;
  dispute: number;
}

export interface AnalysisFeedbackRepository {
  create(data: CreateAnalysisFeedbackData): Promise<AnalysisFeedback>;
  upsert(data: CreateAnalysisFeedbackData): Promise<AnalysisFeedback>;
  findByAnalysisAndUser(
    analysisId: string,
    userId: string
  ): Promise<AnalysisFeedback | null>;
  countByType(analysisId: string): Promise<AnalysisFeedbackCounts>;
}
