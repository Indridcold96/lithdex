import type { Analysis } from "../entities/Analysis";
import type { AnalysisStatus } from "../enums/AnalysisStatus";
import type { AnalysisVisibility } from "../enums/AnalysisVisibility";

export interface CreateAnalysisShellData {
  userId: string | null;
  title: string | null;
  status: AnalysisStatus;
  visibility: AnalysisVisibility;
  publishedAt: Date | null;
}

export interface ListPublicAnalysesOptions {
  limit?: number;
  cursor?: string;
}

export interface ListUserAnalysesOptions {
  limit?: number;
  cursor?: string;
}

export interface AnalysisRepository {
  createShell(data: CreateAnalysisShellData): Promise<Analysis>;
  findById(id: string): Promise<Analysis | null>;
  listPublic(options?: ListPublicAnalysesOptions): Promise<Analysis[]>;
  listByUserId(
    userId: string,
    options?: ListUserAnalysesOptions
  ): Promise<Analysis[]>;
  updateVisibility(
    id: string,
    visibility: AnalysisVisibility
  ): Promise<Analysis>;
  updateStatus(id: string, status: AnalysisStatus): Promise<Analysis>;
  deleteById(id: string): Promise<void>;
}
