import type { AnalysisStatus } from "../enums/AnalysisStatus";
import type { AnalysisVisibility } from "../enums/AnalysisVisibility";

export interface Analysis {
  id: string;
  userId: string | null;
  title: string | null;
  status: AnalysisStatus;
  visibility: AnalysisVisibility;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
