import type { AnalysisInteractionRole } from "../enums/AnalysisInteractionRole";
import type { AnalysisInteractionType } from "../enums/AnalysisInteractionType";

export interface AnalysisInteraction {
  id: string;
  analysisId: string;
  role: AnalysisInteractionRole;
  interactionType: AnalysisInteractionType;
  content: string;
  metadataJson: unknown | null;
  createdAt: Date;
}
