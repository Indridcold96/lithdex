import type { AnalysisComment } from "@/domain/entities/AnalysisComment";
import type { User } from "@/domain/entities/User";

import { toPublicUserDto, type PublicUserDto } from "./AuthenticatedUserDto";

export interface AnalysisCommentDto {
  id: string;
  analysisId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: PublicUserDto | null;
}

export function toAnalysisCommentDto(
  comment: AnalysisComment,
  author: User | null
): AnalysisCommentDto {
  return {
    id: comment.id,
    analysisId: comment.analysisId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: author ? toPublicUserDto(author) : null,
  };
}
