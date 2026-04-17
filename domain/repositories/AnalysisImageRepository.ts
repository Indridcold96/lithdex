import type { AnalysisImage } from "../entities/AnalysisImage";

export interface CreateAnalysisImageData {
  analysisId: string;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string | null;
  sortOrder: number;
}

export interface AnalysisImageRepository {
  create(data: CreateAnalysisImageData): Promise<AnalysisImage>;
  findById(id: string): Promise<AnalysisImage | null>;
  listByAnalysisId(analysisId: string): Promise<AnalysisImage[]>;
}
