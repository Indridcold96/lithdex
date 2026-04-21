import type { AnalysisComment } from "@/domain/entities/AnalysisComment";
import type { User } from "@/domain/entities/User";

import { toPublicUserDto, type PublicUserDto } from "./AuthenticatedUserDto";

export interface AnalysisCommentViewerPermissionsDto {
  canEdit: boolean;
  canDelete: boolean;
}

export interface AnalysisCommentDto {
  id: string;
  analysisId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: PublicUserDto | null;
  isEdited: boolean;
  viewerPermissions: AnalysisCommentViewerPermissionsDto;
}

export function toAnalysisCommentDto(
  comment: AnalysisComment,
  author: User | null,
  viewerUserId: string | null
): AnalysisCommentDto {
  const isAuthor =
    viewerUserId !== null && comment.userId === viewerUserId;

  return {
    id: comment.id,
    analysisId: comment.analysisId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: author ? toPublicUserDto(author) : null,
    isEdited: comment.updatedAt.getTime() > comment.createdAt.getTime(),
    viewerPermissions: {
      canEdit: isAuthor,
      canDelete: isAuthor,
    },
  };
}
