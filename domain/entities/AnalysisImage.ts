export interface AnalysisImage {
  id: string;
  analysisId: string;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string | null;
  sortOrder: number;
  createdAt: Date;
}
