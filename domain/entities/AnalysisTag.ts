import type { AnalysisTagSource } from "../enums/AnalysisTagSource";

import type { Tag } from "./Tag";

export interface AnalysisTag {
  analysisId: string;
  tagId: string;
  sourceType: AnalysisTagSource;
  createdAt: Date;
  tag: Tag;
}
