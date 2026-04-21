import type { AnalysisComment } from "../entities/AnalysisComment";

export interface CreateAnalysisCommentData {
  analysisId: string;
  userId: string;
  content: string;
}

export interface AnalysisCommentRepository {
  create(data: CreateAnalysisCommentData): Promise<AnalysisComment>;
  findById(id: string): Promise<AnalysisComment | null>;
  listByAnalysisId(analysisId: string): Promise<AnalysisComment[]>;
  updateContent(id: string, content: string): Promise<AnalysisComment>;
  deleteById(id: string): Promise<void>;
}
