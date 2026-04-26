import { AnalysisInteractionRole } from "@/domain/enums/AnalysisInteractionRole";
import { AnalysisInteractionType } from "@/domain/enums/AnalysisInteractionType";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import type { AnalysisInteractionRepository } from "@/domain/repositories/AnalysisInteractionRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import type { AnalysisRunOutcomeDto } from "../dto/AnalysisRunOutcomeDto";
import {
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "../errors";
import type { RunAnalysisPass } from "./run-analysis-pass";

export const MAX_DISPUTE_IDENTIFICATION_LENGTH = 120;
export const MAX_DISPUTE_REASON_LENGTH = 2000;

export interface DisputeAnalysisResultAndRunInput {
  analysisId: string;
  requesterUserId: string | null;
  proposedIdentification: string;
  reason: string;
}

export interface DisputeAnalysisResultAndRunDeps {
  analysisRepository: AnalysisRepository;
  analysisInteractionRepository: AnalysisInteractionRepository;
  runAnalysisPass: RunAnalysisPass;
}

function normalizeRequiredText(
  value: string,
  fieldLabel: string,
  maxLength: number
): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ValidationError(`${fieldLabel} cannot be empty.`);
  }
  if (normalized.length > maxLength) {
    throw new ValidationError(
      `${fieldLabel} must be ${maxLength} characters or fewer.`
    );
  }
  return normalized;
}

function canDispute(status: AnalysisStatus | string): boolean {
  return (
    status === AnalysisStatus.COMPLETED ||
    status === AnalysisStatus.INCONCLUSIVE
  );
}

export function makeDisputeAnalysisResultAndRun(
  deps: DisputeAnalysisResultAndRunDeps
) {
  return async function disputeAnalysisResultAndRun(
    input: DisputeAnalysisResultAndRunInput
  ): Promise<AnalysisRunOutcomeDto> {
    if (!input.requesterUserId) {
      throw new UnauthenticatedError("Authentication required.");
    }

    const proposedIdentification = normalizeRequiredText(
      input.proposedIdentification,
      "Proposed identification",
      MAX_DISPUTE_IDENTIFICATION_LENGTH
    );
    const reason = normalizeRequiredText(
      input.reason,
      "Dispute reason",
      MAX_DISPUTE_REASON_LENGTH
    );

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId !== input.requesterUserId) {
      throw new ForbiddenError("Only the owner can dispute this AI result.");
    }
    if (!canDispute(analysis.status)) {
      throw new ValidationError(
        "Only completed or inconclusive analyses can be disputed."
      );
    }

    await deps.analysisInteractionRepository.create({
      analysisId: analysis.id,
      role: AnalysisInteractionRole.USER,
      interactionType: AnalysisInteractionType.OWNER_RESULT_DISPUTE,
      content: `Owner disputed the AI result and proposed: ${proposedIdentification}`,
      metadataJson: {
        proposedIdentification,
        reason,
      },
    });

    await deps.analysisRepository.updateStatus(
      analysis.id,
      AnalysisStatus.PROCESSING
    );

    return deps.runAnalysisPass({
      analysisId: analysis.id,
      requesterUserId: input.requesterUserId,
      assumeAlreadyProcessing: true,
    });
  };
}

export type DisputeAnalysisResultAndRun = ReturnType<
  typeof makeDisputeAnalysisResultAndRun
>;
