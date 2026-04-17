import type { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";

import type { AnalysisCommentDto } from "./AnalysisCommentDto";
import type { AnalysisDto } from "./AnalysisDto";
import type { AnalysisResultDto } from "./AnalysisResultDto";
import type { PublicUserDto } from "./AuthenticatedUserDto";

export interface AnalysisFeedbackSummaryDto {
  confirmCount: number;
  disputeCount: number;
}

export interface AnalysisDetailDto extends AnalysisDto {
  owner: PublicUserDto | null;
  result: AnalysisResultDto | null;
  comments: AnalysisCommentDto[];
  feedbackSummary: AnalysisFeedbackSummaryDto;
  viewerFeedback: AnalysisFeedbackType | null;
}
