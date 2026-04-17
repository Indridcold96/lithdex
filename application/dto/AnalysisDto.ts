import type { Analysis } from "@/domain/entities/Analysis";
import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import type { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";

export interface AnalysisImageDto {
  id: string;
  url: string;
  sortOrder: number;
  mimeType: string | null;
  originalFilename: string | null;
}

export interface AnalysisDto {
  id: string;
  userId: string | null;
  title: string | null;
  status: AnalysisStatus;
  visibility: AnalysisVisibility;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images: AnalysisImageDto[];
}

export function buildInternalImageUrl(imageId: string): string {
  return `/api/media/${imageId}`;
}

export function toAnalysisImageDto(image: AnalysisImage): AnalysisImageDto {
  return {
    id: image.id,
    url: buildInternalImageUrl(image.id),
    sortOrder: image.sortOrder,
    mimeType: image.mimeType,
    originalFilename: image.originalFilename,
  };
}

export function toAnalysisDto(
  analysis: Analysis,
  images: AnalysisImage[]
): AnalysisDto {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: analysis.id,
    userId: analysis.userId,
    title: analysis.title,
    status: analysis.status,
    visibility: analysis.visibility,
    publishedAt: analysis.publishedAt,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
    images: sorted.map(toAnalysisImageDto),
  };
}
