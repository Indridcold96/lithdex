import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import type { FileStorage } from "@/domain/storage/FileStorage";

import {
  isAllowedImageMimeType,
  MAX_ANALYSIS_IMAGES,
  MAX_IMAGE_BYTES,
  MIN_ANALYSIS_IMAGES,
  type AllowedImageMimeType,
} from "../config/uploads";
import { toAnalysisDto, type AnalysisDto } from "../dto/AnalysisDto";
import { ValidationError } from "../errors";

export interface UploadedFileInput {
  body: Buffer;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface CreateAnalysisWithUploadsInput {
  userId: string;
  title?: string | null;
  visibility?: AnalysisVisibility | string;
  files: UploadedFileInput[];
}

export interface CreateAnalysisWithUploadsDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
  fileStorage: FileStorage;
  buildStorageKey: (args: {
    analysisId: string;
    sortOrder: number;
    mimeType: AllowedImageMimeType;
  }) => string;
}

function parseVisibility(
  value: AnalysisVisibility | string | undefined
): AnalysisVisibility {
  if (value === undefined) return AnalysisVisibility.PUBLIC;
  if (
    value === AnalysisVisibility.PUBLIC ||
    value === AnalysisVisibility.PRIVATE
  ) {
    return value;
  }
  throw new ValidationError(`Unsupported visibility: ${String(value)}`);
}

function validateFiles(files: UploadedFileInput[]): AllowedImageMimeType[] {
  if (files.length < MIN_ANALYSIS_IMAGES) {
    throw new ValidationError(
      `An analysis requires at least ${MIN_ANALYSIS_IMAGES} images.`
    );
  }
  if (files.length > MAX_ANALYSIS_IMAGES) {
    throw new ValidationError(
      `An analysis can have at most ${MAX_ANALYSIS_IMAGES} images.`
    );
  }

  return files.map((file, index) => {
    if (!file.size || file.body.length === 0) {
      throw new ValidationError(`images[${index}] is empty.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ValidationError(
        `images[${index}] exceeds the ${MAX_IMAGE_BYTES}-byte limit.`
      );
    }
    if (!isAllowedImageMimeType(file.mimeType)) {
      throw new ValidationError(
        `images[${index}] has an unsupported mime type: ${file.mimeType}`
      );
    }
    return file.mimeType;
  });
}

export function makeCreateAnalysisWithUploads(
  deps: CreateAnalysisWithUploadsDeps
) {
  return async function createAnalysisWithUploads(
    input: CreateAnalysisWithUploadsInput
  ): Promise<AnalysisDto> {
    const visibility = parseVisibility(input.visibility);
    const allowedMimes = validateFiles(input.files);

    const title = input.title?.trim() ? input.title.trim() : null;
    const publishedAt =
      visibility === AnalysisVisibility.PUBLIC ? new Date() : null;

    const analysis = await deps.analysisRepository.createShell({
      userId: input.userId,
      title,
      status: AnalysisStatus.SUBMITTED,
      visibility,
      publishedAt,
    });

    const uploadedKeys: string[] = [];
    const imageRecords: AnalysisImage[] = [];

    try {
      for (let index = 0; index < input.files.length; index++) {
        const file = input.files[index];
        const mimeType = allowedMimes[index];

        const storageKey = deps.buildStorageKey({
          analysisId: analysis.id,
          sortOrder: index,
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
          sortOrder: index,
        });
        imageRecords.push(image);
      }
    } catch (error) {
      await rollback(deps, analysis.id, uploadedKeys);
      throw error;
    }

    return toAnalysisDto(analysis, imageRecords);
  };
}

async function rollback(
  deps: CreateAnalysisWithUploadsDeps,
  analysisId: string,
  uploadedKeys: string[]
): Promise<void> {
  await Promise.allSettled(
    uploadedKeys.map((key) => deps.fileStorage.delete(key))
  );
  try {
    await deps.analysisRepository.deleteById(analysisId);
  } catch {
    // best-effort rollback; swallow to avoid masking the original error
  }
}

export type CreateAnalysisWithUploads = ReturnType<
  typeof makeCreateAnalysisWithUploads
>;
