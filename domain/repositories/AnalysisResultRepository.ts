import type { AnalysisResult } from "../entities/AnalysisResult";

export interface UpsertAnalysisResultData {
  analysisId: string;
  primaryMineralId: string | null;
  confidence: number | null;
  explanation: string | null;
  alternativesJson: unknown | null;
  sourceType: string;
  rawOutputJson: unknown | null;
}

export interface AnalysisResultRepository {
  findByAnalysisId(analysisId: string): Promise<AnalysisResult | null>;
  upsertByAnalysisId(data: UpsertAnalysisResultData): Promise<AnalysisResult>;
}
