import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";

import type { AnalysisInteractionDto } from "./AnalysisInteractionDto";
import type { AnalysisResultDto } from "./AnalysisResultDto";

// Response surface of a single synchronous analysis pass. Summarizes the
// resulting status, the freshly created assistant interaction (if any), and
// the final result when the analysis reached a terminal success.
export interface AnalysisRunOutcomeDto {
  analysisId: string;
  status: AnalysisStatus;
  // The normalized outcome of this pass.
  kind: "final" | "needs_images" | "needs_clarification" | "inconclusive";
  assistantInteraction: AnalysisInteractionDto | null;
  result: AnalysisResultDto | null;
}
