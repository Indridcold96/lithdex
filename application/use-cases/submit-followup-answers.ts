import {
  AnalysisInteractionRole,
} from "@/domain/enums/AnalysisInteractionRole";
import {
  AnalysisInteractionType,
} from "@/domain/enums/AnalysisInteractionType";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import type { AnalysisInteractionRepository } from "@/domain/repositories/AnalysisInteractionRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import {
  toAnalysisInteractionDto,
  type AnalysisInteractionDto,
} from "../dto/AnalysisInteractionDto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors";

export interface FollowupAnswerInput {
  questionId: string;
  answer: string;
}

export interface SubmitFollowupAnswersInput {
  analysisId: string;
  requesterUserId: string;
  answers: FollowupAnswerInput[];
}

export interface SubmitFollowupAnswersDeps {
  analysisRepository: AnalysisRepository;
  analysisInteractionRepository: AnalysisInteractionRepository;
}

interface StoredQuestion {
  id: string;
  prompt?: string;
  options?: string[];
}

function extractQuestions(metadata: unknown | null): StoredQuestion[] {
  if (
    metadata &&
    typeof metadata === "object" &&
    "questions" in metadata &&
    Array.isArray((metadata as { questions: unknown }).questions)
  ) {
    return (metadata as { questions: StoredQuestion[] }).questions.filter(
      (q) => typeof q?.id === "string" && q.id.length > 0
    );
  }
  return [];
}

export function makeSubmitFollowupAnswers(deps: SubmitFollowupAnswersDeps) {
  return async function submitFollowupAnswers(
    input: SubmitFollowupAnswersInput
  ): Promise<AnalysisInteractionDto> {
    if (input.answers.length === 0) {
      throw new ValidationError("At least one answer is required.");
    }

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId !== input.requesterUserId) {
      throw new ForbiddenError(
        "Only the owner can answer follow-up questions."
      );
    }
    if (analysis.status !== AnalysisStatus.NEEDS_INPUT) {
      throw new ConflictError(
        `Analysis is not waiting for answers (current status: ${analysis.status}).`
      );
    }

    const latestQuestion =
      await deps.analysisInteractionRepository.findLatestByType(
        analysis.id,
        AnalysisInteractionType.ASSISTANT_QUESTION
      );
    if (!latestQuestion) {
      throw new ConflictError(
        "No assistant question is currently pending on this analysis."
      );
    }

    const allowedQuestions = extractQuestions(latestQuestion.metadataJson);
    if (allowedQuestions.length === 0) {
      throw new ConflictError(
        "The current assistant question payload does not contain any questions."
      );
    }

    const allowedIds = new Set(allowedQuestions.map((q) => q.id));
    const seen = new Set<string>();
    const normalized: FollowupAnswerInput[] = [];
    for (const raw of input.answers) {
      const id = raw.questionId?.trim();
      const answer = raw.answer?.trim();
      if (!id || !answer) {
        throw new ValidationError(
          "Each answer must include a non-empty questionId and answer."
        );
      }
      if (!allowedIds.has(id)) {
        throw new ValidationError(
          `Answer references unknown questionId: ${id}`
        );
      }
      if (seen.has(id)) {
        throw new ValidationError(
          `Answer submitted twice for questionId: ${id}`
        );
      }
      seen.add(id);
      normalized.push({ questionId: id, answer });
    }

    // Aggregate the answers into one structured interaction. The content
    // string is a short human-readable summary; the full structured payload
    // lives in metadataJson for the AI to consume on the next pass.
    const contentSummary = normalized
      .map((a) => `${a.questionId}: ${a.answer}`)
      .join("\n");

    const interaction = await deps.analysisInteractionRepository.create({
      analysisId: analysis.id,
      role: AnalysisInteractionRole.USER,
      interactionType: AnalysisInteractionType.USER_FOLLOWUP_ANSWER,
      content: contentSummary,
      metadataJson: {
        answers: normalized,
        answeredAt: new Date().toISOString(),
        questionInteractionId: latestQuestion.id,
      },
    });

    return toAnalysisInteractionDto(interaction);
  };
}

export type SubmitFollowupAnswers = ReturnType<
  typeof makeSubmitFollowupAnswers
>;
