import type {
  AIAnalysisProvider,
  AIAnalysisResponse,
} from "@/domain/ai/AIAnalysisProvider";
import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import {
  AnalysisInteractionRole,
} from "@/domain/enums/AnalysisInteractionRole";
import {
  AnalysisInteractionType,
} from "@/domain/enums/AnalysisInteractionType";
import {
  AnalysisStatus,
  canStartOrContinue,
} from "@/domain/enums/AnalysisStatus";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisInteractionRepository } from "@/domain/repositories/AnalysisInteractionRepository";
import type { AnalysisTagRepository } from "@/domain/repositories/AnalysisTagRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { AnalysisResultRepository } from "@/domain/repositories/AnalysisResultRepository";
import type { TagRepository } from "@/domain/repositories/TagRepository";
import { shouldPublishAnalysis } from "@/domain/rules/analysis";
import type { FileStorage } from "@/domain/storage/FileStorage";

import { applySystemAnalysisTags } from "./tags/system-analysis-tags";
import { toAnalysisInteractionDto } from "../dto/AnalysisInteractionDto";
import type { AnalysisRunOutcomeDto } from "../dto/AnalysisRunOutcomeDto";
import { toAnalysisResultDto } from "../dto/AnalysisResultDto";
import {
  AIProviderError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors";
import { MIN_ANALYSIS_IMAGES } from "../config/uploads";

export interface RunAnalysisPassInput {
  analysisId: string;
  requesterUserId: string;
  assumeAlreadyProcessing?: boolean;
}

export interface RunAnalysisPassDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
  analysisInteractionRepository: AnalysisInteractionRepository;
  analysisResultRepository: AnalysisResultRepository;
  analysisTagRepository: AnalysisTagRepository;
  tagRepository: TagRepository;
  aiAnalysisProvider: AIAnalysisProvider;
  fileStorage: FileStorage;
  prepareImages: (
    images: AnalysisImage[],
    storage: FileStorage
  ) => Promise<
    {
      mimeType: string;
      base64: string;
    }[]
  >;
}

const MAX_GUIDED_FOLLOWUP_TURNS = 3;

interface StoredQuestion {
  id?: string;
  prompt?: string;
  intentKey?: string;
}

function normalizeIntentKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function getQuestionIntentKey(question: StoredQuestion): string {
  if (typeof question.intentKey === "string" && question.intentKey.length > 0) {
    return normalizeIntentKey(question.intentKey);
  }
  if (typeof question.prompt === "string" && question.prompt.length > 0) {
    return normalizeIntentKey(question.prompt);
  }
  return "";
}

function extractStoredQuestions(metadata: unknown | null): StoredQuestion[] {
  if (
    metadata &&
    typeof metadata === "object" &&
    "questions" in metadata &&
    Array.isArray((metadata as { questions: unknown }).questions)
  ) {
    return (metadata as { questions: StoredQuestion[] }).questions.filter(
      (question) => question && typeof question === "object"
    );
  }
  return [];
}

function extractRequestedImageTypes(metadata: unknown | null): string[] {
  if (
    metadata &&
    typeof metadata === "object" &&
    "requestedImageTypes" in metadata &&
    Array.isArray((metadata as { requestedImageTypes: unknown }).requestedImageTypes)
  ) {
    return (
      metadata as { requestedImageTypes: string[] }
    ).requestedImageTypes.filter(
      (requestedType) =>
        typeof requestedType === "string" && requestedType.length > 0
    );
  }
  return [];
}

function countAssistantFollowupTurns(
  interactions: Awaited<
    ReturnType<AnalysisInteractionRepository["listByAnalysisId"]>
  >
): number {
  return interactions.filter(
    (interaction) =>
      interaction.interactionType ===
        AnalysisInteractionType.ASSISTANT_QUESTION ||
      interaction.interactionType ===
        AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST
  ).length;
}

function collectPriorQuestionIntentKeys(
  interactions: Awaited<
    ReturnType<AnalysisInteractionRepository["listByAnalysisId"]>
  >
): Set<string> {
  return new Set(
    interactions
      .filter(
        (interaction) =>
          interaction.interactionType ===
          AnalysisInteractionType.ASSISTANT_QUESTION
      )
      .flatMap((interaction) => extractStoredQuestions(interaction.metadataJson))
      .map(getQuestionIntentKey)
      .filter((intentKey) => intentKey.length > 0)
  );
}

function collectPriorImageRequestIntentKeys(
  interactions: Awaited<
    ReturnType<AnalysisInteractionRepository["listByAnalysisId"]>
  >
): Set<string> {
  return new Set(
    interactions
      .filter(
        (interaction) =>
          interaction.interactionType ===
          AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST
      )
      .flatMap((interaction) =>
        extractRequestedImageTypes(interaction.metadataJson)
      )
      .map(normalizeIntentKey)
      .filter((intentKey) => intentKey.length > 0)
  );
}

function makeGuardrailInconclusiveResponse(
  response: Extract<
    AIAnalysisResponse,
    { kind: "needs_images" | "needs_clarification" }
  >,
  reason: string,
  summary: string
): Extract<AIAnalysisResponse, { kind: "inconclusive" }> {
  return {
    kind: "inconclusive",
    summary,
    reason,
    rawProviderOutput: response.rawProviderOutput,
  };
}

function applyFollowupGuardrails(
  response: AIAnalysisResponse,
  priorInteractions: Awaited<
    ReturnType<AnalysisInteractionRepository["listByAnalysisId"]>
  >
): AIAnalysisResponse {
  if (response.kind !== "needs_images" && response.kind !== "needs_clarification") {
    return response;
  }

  if (countAssistantFollowupTurns(priorInteractions) >= MAX_GUIDED_FOLLOWUP_TURNS) {
    return makeGuardrailInconclusiveResponse(
      response,
      "followup_limit_reached",
      "The analysis remains inconclusive after the maximum guided follow-up steps."
    );
  }

  if (response.kind === "needs_clarification") {
    const priorIntentKeys = collectPriorQuestionIntentKeys(priorInteractions);
    const seenIntentKeys = new Set<string>();
    const filteredQuestions = response.questions.filter((question) => {
      const intentKey = getQuestionIntentKey(question);
      if (intentKey.length === 0) {
        return true;
      }
      if (priorIntentKeys.has(intentKey) || seenIntentKeys.has(intentKey)) {
        return false;
      }
      seenIntentKeys.add(intentKey);
      return true;
    });

    if (filteredQuestions.length === 0) {
      return makeGuardrailInconclusiveResponse(
        response,
        "duplicate_followup_intent",
        "The analysis remains inconclusive because additional clarification would repeat earlier questions."
      );
    }

    if (filteredQuestions.length !== response.questions.length) {
      return {
        ...response,
        questions: filteredQuestions,
      };
    }

    return response;
  }

  const priorRequestedImageIntentKeys =
    collectPriorImageRequestIntentKeys(priorInteractions);
  const seenRequestedImageIntentKeys = new Set<string>();
  const filteredImageTypes = response.requestedImageTypes.filter(
    (requestedImageType) => {
      const intentKey = normalizeIntentKey(requestedImageType);
      if (intentKey.length === 0) {
        return true;
      }
      if (
        priorRequestedImageIntentKeys.has(intentKey) ||
        seenRequestedImageIntentKeys.has(intentKey)
      ) {
        return false;
      }
      seenRequestedImageIntentKeys.add(intentKey);
      return true;
    }
  );

  if (filteredImageTypes.length === 0) {
    return makeGuardrailInconclusiveResponse(
      response,
      "duplicate_followup_intent",
      "The analysis remains inconclusive because additional image requests would repeat earlier requests."
    );
  }

  if (filteredImageTypes.length !== response.requestedImageTypes.length) {
    return {
      ...response,
      requestedImageTypes: filteredImageTypes,
    };
  }

  return response;
}

export function makeRunAnalysisPass(deps: RunAnalysisPassDeps) {
  return async function runAnalysisPass(
    input: RunAnalysisPassInput
  ): Promise<AnalysisRunOutcomeDto> {
    async function persistStatus(
      analysisId: string,
      status: AnalysisStatus
    ): Promise<void> {
      const updated = await deps.analysisRepository.updateStatus(
        analysisId,
        status
      );

      if (!shouldPublishAnalysis(updated)) {
        return;
      }

      await deps.analysisRepository.setPublishedAt(updated.id, new Date());
    }

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId !== input.requesterUserId) {
      throw new ForbiddenError(
        "Only the owner can run synchronous analysis on this analysis."
      );
    }
    const canUseExistingProcessingState =
      input.assumeAlreadyProcessing === true &&
      analysis.status === AnalysisStatus.PROCESSING;
    const shouldRestartFromFailure = analysis.status === AnalysisStatus.FAILED;

    if (
      !canStartOrContinue(analysis.status) &&
      !canUseExistingProcessingState
    ) {
      throw new ConflictError(
        `Analysis is ${analysis.status} and cannot be (re)started.`
      );
    }

    const images = await deps.analysisImageRepository.listByAnalysisId(
      analysis.id
    );
    if (images.length < MIN_ANALYSIS_IMAGES) {
      throw new ValidationError(
        `Analysis needs at least ${MIN_ANALYSIS_IMAGES} images before running.`
      );
    }

    // Flip status to PROCESSING before calling the provider so concurrent
    // requests observe the in-flight state. On any later failure we set FAILED
    // and record a system_status interaction.
    if (!canUseExistingProcessingState) {
      await persistStatus(analysis.id, AnalysisStatus.PROCESSING);
    }

    const storedPriorInteractions =
      await deps.analysisInteractionRepository.listByAnalysisId(analysis.id);
    const effectivePriorInteractions = shouldRestartFromFailure
      ? []
      : storedPriorInteractions;

    let response: AIAnalysisResponse;
    try {
      const imageInputs = await deps.prepareImages(images, deps.fileStorage);

      response = await deps.aiAnalysisProvider.analyze({
        analysisId: analysis.id,
        title: analysis.title,
        images: imageInputs,
        priorInteractions: effectivePriorInteractions.map((interaction) => ({
          role: interaction.role,
          interactionType: interaction.interactionType,
          content: interaction.content,
          metadataJson: interaction.metadataJson,
        })),
      });
    } catch (error) {
      const message =
        error instanceof AIProviderError
          ? error.message
          : "The AI provider failed to complete the analysis.";

      await deps.analysisInteractionRepository.create({
        analysisId: analysis.id,
        role: AnalysisInteractionRole.SYSTEM,
        interactionType: AnalysisInteractionType.SYSTEM_STATUS,
        content: "provider_error",
        metadataJson: { event: "provider_error", detail: message },
      });
      await persistStatus(analysis.id, AnalysisStatus.FAILED);
      throw error instanceof AIProviderError
        ? error
        : new AIProviderError(message);
    }

    response = applyFollowupGuardrails(response, effectivePriorInteractions);

    // Normalize response -> persistence. Each branch:
    //  - creates exactly one assistant interaction that describes what it did
    //  - upserts the final result only when kind === "final"
    //  - transitions status to the appropriate terminal or interim state
    switch (response.kind) {
      case "final": {
        const interaction = await deps.analysisInteractionRepository.create({
          analysisId: analysis.id,
          role: AnalysisInteractionRole.ASSISTANT,
          interactionType: AnalysisInteractionType.ASSISTANT_FINAL_SUMMARY,
          content: response.summary,
          metadataJson: {
            summary: response.summary,
            confidence: response.confidence,
            primaryMineralName: response.primaryMineralName,
            alternatives: response.alternatives,
            inconclusive: false,
          },
        });

        const result = await deps.analysisResultRepository.upsertByAnalysisId({
          analysisId: analysis.id,
          // We store the mineral NAME inside rawOutputJson for now; linking to
          // a real `Mineral` row happens later.
          primaryMineralId: null,
          confidence: response.confidence,
          explanation: response.explanation,
          alternativesJson: response.alternatives,
          sourceType: deps.aiAnalysisProvider.sourceType,
          rawOutputJson: {
            primaryMineralName: response.primaryMineralName,
            rawProviderOutput: response.rawProviderOutput,
          },
        });

        await applySystemAnalysisTags(
          {
            analysisTagRepository: deps.analysisTagRepository,
            tagRepository: deps.tagRepository,
          },
          {
            analysisId: analysis.id,
            rawTags: response.tags,
          }
        );

        await persistStatus(analysis.id, AnalysisStatus.COMPLETED);

        return {
          analysisId: analysis.id,
          status: AnalysisStatus.COMPLETED,
          kind: "final",
          assistantInteraction: toAnalysisInteractionDto(interaction),
          result: toAnalysisResultDto(result),
        };
      }

      case "needs_images": {
        const interaction = await deps.analysisInteractionRepository.create({
          analysisId: analysis.id,
          role: AnalysisInteractionRole.ASSISTANT,
          interactionType: AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST,
          content: response.summary,
          metadataJson: {
            requestedImageTypes: response.requestedImageTypes,
            rationale: response.rationale,
          },
        });

        await persistStatus(analysis.id, AnalysisStatus.NEEDS_INPUT);

        return {
          analysisId: analysis.id,
          status: AnalysisStatus.NEEDS_INPUT,
          kind: "needs_images",
          assistantInteraction: toAnalysisInteractionDto(interaction),
          result: null,
        };
      }

      case "needs_clarification": {
        const interaction = await deps.analysisInteractionRepository.create({
          analysisId: analysis.id,
          role: AnalysisInteractionRole.ASSISTANT,
          interactionType: AnalysisInteractionType.ASSISTANT_QUESTION,
          content: response.summary,
          metadataJson: {
            questions: response.questions,
            rationale: response.rationale,
          },
        });

        await persistStatus(analysis.id, AnalysisStatus.NEEDS_INPUT);

        return {
          analysisId: analysis.id,
          status: AnalysisStatus.NEEDS_INPUT,
          kind: "needs_clarification",
          assistantInteraction: toAnalysisInteractionDto(interaction),
          result: null,
        };
      }

      case "inconclusive": {
        const interaction = await deps.analysisInteractionRepository.create({
          analysisId: analysis.id,
          role: AnalysisInteractionRole.ASSISTANT,
          interactionType: AnalysisInteractionType.ASSISTANT_FINAL_SUMMARY,
          content: response.summary,
          metadataJson: {
            summary: response.summary,
            inconclusive: true,
            reason: response.reason,
          },
        });

        await persistStatus(analysis.id, AnalysisStatus.INCONCLUSIVE);

        return {
          analysisId: analysis.id,
          status: AnalysisStatus.INCONCLUSIVE,
          kind: "inconclusive",
          assistantInteraction: toAnalysisInteractionDto(interaction),
          result: null,
        };
      }
    }
  };
}

export type RunAnalysisPass = ReturnType<typeof makeRunAnalysisPass>;
