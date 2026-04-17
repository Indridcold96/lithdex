import type { AnalysisInteraction } from "@/domain/entities/AnalysisInteraction";
import type { AnalysisInteractionRole } from "@/domain/enums/AnalysisInteractionRole";
import type { AnalysisInteractionType } from "@/domain/enums/AnalysisInteractionType";

export interface AnalysisInteractionDto {
  id: string;
  analysisId: string;
  role: AnalysisInteractionRole;
  interactionType: AnalysisInteractionType;
  content: string;
  metadata: unknown | null;
  createdAt: Date;
}

export function toAnalysisInteractionDto(
  interaction: AnalysisInteraction
): AnalysisInteractionDto {
  return {
    id: interaction.id,
    analysisId: interaction.analysisId,
    role: interaction.role,
    interactionType: interaction.interactionType,
    content: interaction.content,
    metadata: interaction.metadataJson,
    createdAt: interaction.createdAt,
  };
}
