import type { AnalysisResult } from "../entities/AnalysisResult";

export interface AnalysisResultRepository {
  findByAnalysisId(analysisId: string): Promise<AnalysisResult | null>;
}
