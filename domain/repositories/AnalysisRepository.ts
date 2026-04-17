import type { Analysis } from "../entities/Analysis";
import type { AnalysisStatus } from "../enums/AnalysisStatus";
import type { AnalysisVisibility } from "../enums/AnalysisVisibility";

export interface CreateAnalysisImageData {
  storageKey: string;
  originalFilename: string | null;
  mimeType: string | null;
  sortOrder: number;
}

export interface CreateAnalysisData {
  userId: string | null;
  title: string | null;
  status: AnalysisStatus;
  visibility: AnalysisVisibility;
  publishedAt: Date | null;
  images: CreateAnalysisImageData[];
}

export interface ListPublicAnalysesOptions {
  limit?: number;
  cursor?: string;
}

export interface AnalysisRepository {
  create(data: CreateAnalysisData): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  listPublic(options?: ListPublicAnalysesOptions): Promise<Analysis[]>;
  updateVisibility(
    id: string,
    visibility: AnalysisVisibility
  ): Promise<Analysis>;
}
