import type { AnalysisDto } from "./AnalysisDto";
import type { AnalysisInteractionDto } from "./AnalysisInteractionDto";
import type { AnalysisResultDto } from "./AnalysisResultDto";

// Owner-only view of an analysis session. Includes the full, unfiltered
// interaction history so the guided UI can render every stage, plus the
// latest assistant question payload for the constrained answer form.
export interface AnalysisSessionDto extends AnalysisDto {
  result: AnalysisResultDto | null;
  interactions: AnalysisInteractionDto[];
}
