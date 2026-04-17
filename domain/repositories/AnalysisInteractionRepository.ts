import type { AnalysisInteraction } from "../entities/AnalysisInteraction";
import type { AnalysisInteractionRole } from "../enums/AnalysisInteractionRole";
import type { AnalysisInteractionType } from "../enums/AnalysisInteractionType";

export interface CreateAnalysisInteractionData {
  analysisId: string;
  role: AnalysisInteractionRole;
  interactionType: AnalysisInteractionType;
  content: string;
  metadataJson: unknown | null;
}

export interface AnalysisInteractionRepository {
  create(
    data: CreateAnalysisInteractionData
  ): Promise<AnalysisInteraction>;
  listByAnalysisId(analysisId: string): Promise<AnalysisInteraction[]>;
  findLatestByType(
    analysisId: string,
    interactionType: AnalysisInteractionType
  ): Promise<AnalysisInteraction | null>;
}
