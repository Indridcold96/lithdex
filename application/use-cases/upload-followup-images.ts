import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import {
  AnalysisInteractionRole,
} from "@/domain/enums/AnalysisInteractionRole";
import {
  AnalysisInteractionType,
} from "@/domain/enums/AnalysisInteractionType";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisInteractionRepository } from "@/domain/repositories/AnalysisInteractionRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { FileStorage } from "@/domain/storage/FileStorage";

import {
  MAX_ANALYSIS_IMAGES,
  MAX_IMAGE_BYTES,
  type AllowedImageMimeType,
} from "../config/uploads";
import {
  toAnalysisImageDto,
  type AnalysisImageDto,
} from "../dto/AnalysisDto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors";
import { validateUploadedImage } from "../files/validate-uploaded-image";
import type { UploadedFileInput } from "./create-analysis-with-uploads";

export interface UploadFollowupImagesInput {
  analysisId: string;
  requesterUserId: string;
  files: UploadedFileInput[];
}

export interface UploadFollowupImagesDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
  analysisInteractionRepository: AnalysisInteractionRepository;
  fileStorage: FileStorage;
  buildStorageKey: (args: {
    analysisId: string;
    sortOrder: number;
    mimeType: AllowedImageMimeType;
  }) => string;
}

async function validateIncomingFiles(
  files: UploadedFileInput[]
): Promise<AllowedImageMimeType[]> {
  if (files.length === 0) {
    throw new ValidationError("No files were provided.");
  }
  return Promise.all(files.map(async (file, index) => {
    if (!file.size || file.body.length === 0) {
      throw new ValidationError(`images[${index}] is empty.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ValidationError(
        `images[${index}] exceeds the ${MAX_IMAGE_BYTES}-byte limit.`
      );
    }
    return validateUploadedImage(file, `images[${index}]`);
  }));
}

export function makeUploadFollowupImages(deps: UploadFollowupImagesDeps) {
  return async function uploadFollowupImages(
    input: UploadFollowupImagesInput
  ): Promise<AnalysisImageDto[]> {
    const allowedMimes = await validateIncomingFiles(input.files);

    const analysis = await deps.analysisRepository.findById(input.analysisId);
    if (!analysis) {
      throw new NotFoundError(`Analysis not found: ${input.analysisId}`);
    }
    if (analysis.userId !== input.requesterUserId) {
      throw new ForbiddenError(
        "Only the owner can attach follow-up images to this analysis."
      );
    }
    if (analysis.status !== AnalysisStatus.NEEDS_INPUT) {
      throw new ConflictError(
        `Analysis is not waiting for additional images (current status: ${analysis.status}).`
      );
    }

    const existing = await deps.analysisImageRepository.listByAnalysisId(
      analysis.id
    );
    if (existing.length + input.files.length > MAX_ANALYSIS_IMAGES) {
      throw new ValidationError(
        `An analysis can have at most ${MAX_ANALYSIS_IMAGES} images total.`
      );
    }

    const nextSortOrderStart =
      existing.reduce((max, img) => Math.max(max, img.sortOrder), -1) + 1;

    const uploadedKeys: string[] = [];
    const imageRecords: AnalysisImage[] = [];

    try {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const mimeType = allowedMimes[i];
        const sortOrder = nextSortOrderStart + i;

        const storageKey = deps.buildStorageKey({
          analysisId: analysis.id,
          sortOrder,
          mimeType,
        });

        await deps.fileStorage.upload({
          key: storageKey,
          body: file.body,
          contentType: mimeType,
        });
        uploadedKeys.push(storageKey);

        const image = await deps.analysisImageRepository.create({
          analysisId: analysis.id,
          storageKey,
          originalFilename: file.originalFilename || null,
          mimeType,
          sortOrder,
        });
        imageRecords.push(image);
      }
    } catch (error) {
      // Best-effort rollback of the objects we actually uploaded in this pass.
      // We do NOT delete the analysis itself because it already existed.
      await Promise.allSettled(
        uploadedKeys.map((key) => deps.fileStorage.delete(key))
      );
      throw error;
    }

    await deps.analysisInteractionRepository.create({
      analysisId: analysis.id,
      role: AnalysisInteractionRole.USER,
      interactionType: AnalysisInteractionType.USER_FOLLOWUP_UPLOAD,
      content: `Uploaded ${imageRecords.length} follow-up image(s).`,
      metadataJson: {
        imageIds: imageRecords.map((img) => img.id),
        count: imageRecords.length,
      },
    });

    return imageRecords.map(toAnalysisImageDto);
  };
}

export type UploadFollowupImages = ReturnType<typeof makeUploadFollowupImages>;
