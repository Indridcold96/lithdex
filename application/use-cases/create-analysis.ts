import type { Analysis } from "@/domain/entities/Analysis";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";
import { canSubmitAnalysis } from "@/domain/rules/analysis";

import { ValidationError } from "../errors";

export interface CreateAnalysisImageInput {
  storageKey: string;
  originalFilename?: string | null;
  mimeType?: string | null;
  sortOrder?: number;
}

export interface CreateAnalysisInput {
  userId?: string | null;
  title?: string | null;
  visibility?: AnalysisVisibility | string;
  images: CreateAnalysisImageInput[];
}

export interface CreateAnalysisDeps {
  analysisRepository: AnalysisRepository;
}

function isAnalysisVisibility(value: string): value is AnalysisVisibility {
  return (Object.values(AnalysisVisibility) as string[]).includes(value);
}

export function makeCreateAnalysis(deps: CreateAnalysisDeps) {
  return async function createAnalysis(
    input: CreateAnalysisInput
  ): Promise<Analysis> {
    const images = Array.isArray(input.images) ? input.images : [];

    if (!canSubmitAnalysis(images.length)) {
      throw new ValidationError(
        "An analysis requires at least 3 images before it can be submitted."
      );
    }

    let visibility: AnalysisVisibility = AnalysisVisibility.PUBLIC;
    if (input.visibility !== undefined) {
      if (!isAnalysisVisibility(input.visibility)) {
        throw new ValidationError(
          `Unsupported visibility: ${String(input.visibility)}`
        );
      }
      visibility = input.visibility;
    }

    const normalizedImages = images.map((image, index) => {
      if (
        typeof image.storageKey !== "string" ||
        image.storageKey.trim().length === 0
      ) {
        throw new ValidationError(
          `images[${index}].storageKey is required.`
        );
      }
      return {
        storageKey: image.storageKey,
        originalFilename: image.originalFilename ?? null,
        mimeType: image.mimeType ?? null,
        sortOrder:
          typeof image.sortOrder === "number" &&
          Number.isFinite(image.sortOrder)
            ? image.sortOrder
            : index,
      };
    });

    const publishedAt =
      visibility === AnalysisVisibility.PUBLIC ? new Date() : null;

    return deps.analysisRepository.create({
      userId: input.userId ?? null,
      title: input.title ?? null,
      status: AnalysisStatus.SUBMITTED,
      visibility,
      publishedAt,
      images: normalizedImages,
    });
  };
}

export type CreateAnalysis = ReturnType<typeof makeCreateAnalysis>;
