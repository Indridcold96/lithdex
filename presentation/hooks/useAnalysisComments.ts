"use client";

import { useState, type FormEvent } from "react";

import type { AnalysisCommentDto } from "@/application/dto/AnalysisCommentDto";

const COMMENT_MAX_LENGTH = 4000;

type CommentErrorMap = Record<string, string | undefined>;

interface UseAnalysisCommentsInput {
  analysisId: string;
  isPublic: boolean;
  isAuthenticated: boolean;
  initialComments: AnalysisCommentDto[];
}

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  return body?.error ?? fallback;
}

export function useAnalysisComments({
  analysisId,
  isPublic,
  isAuthenticated,
  initialComments,
}: UseAnalysisCommentsInput) {
  const [comments, setComments] =
    useState<AnalysisCommentDto[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [commentErrors, setCommentErrors] = useState<CommentErrorMap>({});

  const canComment = isPublic && isAuthenticated;

  function clearCommentError(commentId: string) {
    setCommentErrors((prev) => {
      if (!(commentId in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  }

  function setCommentError(commentId: string, message: string) {
    setCommentErrors((prev) => ({
      ...prev,
      [commentId]: message,
    }));
  }

  function startEditing(comment: AnalysisCommentDto) {
    if (!comment.viewerPermissions.canEdit) {
      return;
    }

    clearCommentError(comment.id);
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  }

  function cancelEditing() {
    setEditingCommentId(null);
    setEditingContent("");
  }

  async function submitNewComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canComment) return;

    const trimmed = content.trim();
    if (trimmed.length === 0) return;

    setSubmitting(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Could not post comment."));
      }

      const comment = (await res.json()) as AnalysisCommentDto;
      setComments((prev) => [...prev, comment]);
      setContent("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(commentId: string) {
    if (editingCommentId !== commentId) {
      return;
    }

    const trimmed = editingContent.trim();
    if (trimmed.length === 0) {
      setCommentError(commentId, "Comment content cannot be empty.");
      return;
    }

    setSavingCommentId(commentId);
    clearCommentError(commentId);
    try {
      const res = await fetch(
        `/api/analyses/${analysisId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editingContent }),
        }
      );

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Could not update comment."));
      }

      const updatedComment = (await res.json()) as AnalysisCommentDto;
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? updatedComment : comment
        )
      );
      cancelEditing();
    } catch (err) {
      setCommentError(
        commentId,
        err instanceof Error ? err.message : "Unexpected error."
      );
    } finally {
      setSavingCommentId(null);
    }
  }

  async function deleteComment(comment: AnalysisCommentDto) {
    if (!comment.viewerPermissions.canDelete) {
      return;
    }

    setDeletingCommentId(comment.id);
    clearCommentError(comment.id);
    try {
      const res = await fetch(
        `/api/analyses/${analysisId}/comments/${comment.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Could not delete comment."));
      }

      setComments((prev) =>
        prev.filter((existingComment) => existingComment.id !== comment.id)
      );
      if (editingCommentId === comment.id) {
        cancelEditing();
      }
    } catch (err) {
      setCommentError(
        comment.id,
        err instanceof Error ? err.message : "Unexpected error."
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  return {
    comments,
    content,
    setContent,
    submitting,
    createError,
    editingCommentId,
    editingContent,
    setEditingContent,
    savingCommentId,
    deletingCommentId,
    commentErrors,
    canComment,
    commentMaxLength: COMMENT_MAX_LENGTH,
    submitNewComment,
    startEditing,
    cancelEditing,
    saveEdit,
    deleteComment,
  };
}
