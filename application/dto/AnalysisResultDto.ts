import type { AnalysisResult } from "@/domain/entities/AnalysisResult";

export interface AnalysisResultDto {
  id: string;
  analysisId: string;
  primaryMineralId: string | null;
  confidence: number | null;
  explanation: string | null;
  sourceType: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toAnalysisResultDto(result: AnalysisResult): AnalysisResultDto {
  return {
    id: result.id,
    analysisId: result.analysisId,
    primaryMineralId: result.primaryMineralId,
    confidence: result.confidence,
    explanation: result.explanation,
    sourceType: result.sourceType,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}
