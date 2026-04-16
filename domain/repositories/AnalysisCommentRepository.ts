import type { AnalysisComment } from "../entities/AnalysisComment";

export interface CreateAnalysisCommentData {
  analysisId: string;
  userId: string;
  content: string;
}

export interface AnalysisCommentRepository {
  create(data: CreateAnalysisCommentData): Promise<AnalysisComment>;
  listByAnalysisId(analysisId: string): Promise<AnalysisComment[]>;
}
