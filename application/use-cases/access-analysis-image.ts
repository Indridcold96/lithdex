import type { Analysis } from "@/domain/entities/Analysis";
import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisImageRepository } from "@/domain/repositories/AnalysisImageRepository";
import type { AnalysisRepository } from "@/domain/repositories/AnalysisRepository";

import {
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from "../errors";

export interface AccessAnalysisImageInput {
  imageId: string;
  viewerUserId: string | null;
}

export interface AccessAnalysisImageResult {
  image: AnalysisImage;
  analysis: Analysis;
}

export interface AccessAnalysisImageDeps {
  analysisRepository: AnalysisRepository;
  analysisImageRepository: AnalysisImageRepository;
}

export function makeAccessAnalysisImage(deps: AccessAnalysisImageDeps) {
  return async function accessAnalysisImage(
    input: AccessAnalysisImageInput
  ): Promise<AccessAnalysisImageResult> {
    const image = await deps.analysisImageRepository.findById(input.imageId);
    if (!image) {
      throw new NotFoundError("Image not found.");
    }

    const analysis = await deps.analysisRepository.findById(image.analysisId);
    if (!analysis) {
      throw new NotFoundError("Image not found.");
    }

    if (analysis.visibility === AnalysisVisibility.PUBLIC) {
      return { image, analysis };
    }

    if (input.viewerUserId === null) {
      throw new UnauthenticatedError("Authentication required.");
    }
    if (input.viewerUserId !== analysis.userId) {
      throw new ForbiddenError("You do not have access to this image.");
    }

    return { image, analysis };
  };
}

export type AccessAnalysisImage = ReturnType<typeof makeAccessAnalysisImage>;
