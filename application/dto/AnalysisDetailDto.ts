import type { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";

import type { AnalysisCommentDto } from "./AnalysisCommentDto";
import type { AnalysisDto } from "./AnalysisDto";
import type { AnalysisInteractionDto } from "./AnalysisInteractionDto";
import type { AnalysisResultDto } from "./AnalysisResultDto";
import type { AnalysisTagDto } from "./AnalysisTagDto";
import type { AnalysisTagSuggestionDto } from "./AnalysisTagSuggestionDto";
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
  tags: AnalysisTagDto[];
  pendingTagSuggestions: AnalysisTagSuggestionDto[];
  // Only meaningful, user-facing interactions (no system noise, no raw uploads).
  interactions: AnalysisInteractionDto[];
}
