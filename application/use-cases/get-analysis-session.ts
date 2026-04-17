import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisInteractionRepository } from "@/domain/repositories/AnalysisInteractionRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { AnalysisResultRepository } from "@/domain/repositories/AnalysisResultRepository";

import { toAnalysisDto } from "../dto/AnalysisDto";
import { toAnalysisInteractionDto } from "../dto/AnalysisInteractionDto";
import { toAnalysisResultDto } from "../dto/AnalysisResultDto";
import type { AnalysisSessionDto } from "../dto/AnalysisSessionDto";
import { ForbiddenError, NotFoundError } from "../errors";

export interface GetAnalysisSessionInput {
  id: string;
  requesterUserId: string;
}

export interface GetAnalysisSessionDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
  analysisInteractionRepository: AnalysisInteractionRepository;
  analysisResultRepository: AnalysisResultRepository;
}

export function makeGetAnalysisSession(deps: GetAnalysisSessionDeps) {
  return async function getAnalysisSession(
    input: GetAnalysisSessionInput
  ): Promise<AnalysisSessionDto> {
    const analysis = await deps.analysisRepository.findById(input.id);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.id}`);
    }
    if (analysis.userId !== input.requesterUserId) {
      // The session view is owner-only regardless of visibility.
      throw new ForbiddenError("Only the owner can open this analysis session.");
    }

    const [images, interactions, result] = await Promise.all([
      deps.analysisImageRepository.listByAnalysisId(analysis.id),
      deps.analysisInteractionRepository.listByAnalysisId(analysis.id),
      deps.analysisResultRepository.findByAnalysisId(analysis.id),
    ]);

    const base = toAnalysisDto(analysis, images);

    return {
      ...base,
      result: result ? toAnalysisResultDto(result) : null,
      interactions: interactions.map(toAnalysisInteractionDto),
    };
  };
}

export type GetAnalysisSession = ReturnType<typeof makeGetAnalysisSession>;
