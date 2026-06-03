import type { AnalysisDto } from "./AnalysisDto";

export interface UserAnalysesCountsDto {
  total: number;
  public: number;
  private: number;
}

export interface UserAnalysesPageDto {
  items: AnalysisDto[];
  nextCursor: string | null;
  hasMore: boolean;
  counts: UserAnalysesCountsDto;
}
