import type { AnalysisTag } from "../entities/AnalysisTag";
import type { AnalysisTagSource } from "../enums/AnalysisTagSource";

export interface AttachAnalysisTagData {
  analysisId: string;
  tagId: string;
  sourceType: AnalysisTagSource;
}

export interface AnalysisTagRepository {
  attach(data: AttachAnalysisTagData): Promise<AnalysisTag>;
  listByAnalysisId(analysisId: string): Promise<AnalysisTag[]>;
  listByAnalysisIds(analysisIds: string[]): Promise<AnalysisTag[]>;
}
