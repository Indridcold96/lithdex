import type { AnalysisDto } from "./AnalysisDto";

export interface PublicAnalysesPageDto {
  items: AnalysisDto[];
  nextCursor: string | null;
  hasMore: boolean;
}
