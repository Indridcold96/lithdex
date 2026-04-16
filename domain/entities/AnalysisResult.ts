export interface AnalysisResult {
  id: string;
  analysisId: string;
  primaryMineralId: string | null;
  confidence: number | null;
  explanation: string | null;
  alternativesJson: unknown | null;
  sourceType: string;
  rawOutputJson: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}
