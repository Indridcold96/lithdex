"use client";

import Link from "next/link";
import type { SubmitEvent } from "react";

import type { AnalysisCommentDto } from "@/application/dto/AnalysisCommentDto";
import { useAnalysisComments } from "@/presentation/hooks/useAnalysisComments";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { Textarea } from "@/presentation/ui/textarea";

interface AnalysisCommentsBlockProps {
  analysisId: string;
  isPublic: boolean;
  isAuthenticated: boolean;
  initialComments: AnalysisCommentDto[];
}

export function AnalysisCommentsBlock({
  analysisId,
  isPublic,
  isAuthenticated,
  initialComments,
}: AnalysisCommentsBlockProps) {
  const {
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
    commentMaxLength,
    submitNewComment,
    startEditing,
    cancelEditing,
    saveEdit,
    deleteComment,
  } = useAnalysisComments({
    analysisId,
    isPublic,
    isAuthenticated,
    initialComments,
  });

  async function handleDelete(comment: AnalysisCommentDto) {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) {
      return;
    }

    await deleteComment(comment);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>
          {isPublic
            ? "Share thoughts or ask questions about this analysis."
            : "Comments are only available on public analyses."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                error={commentErrors[comment.id] ?? null}
                isEditing={editingCommentId === comment.id}
                isManagementLocked={
                  editingCommentId !== null && editingCommentId !== comment.id
                }
                isSaving={savingCommentId === comment.id}
                isDeleting={deletingCommentId === comment.id}
                editingContent={editingContent}
                onEditingContentChange={setEditingContent}
                onStartEditing={() => startEditing(comment)}
                onCancelEditing={cancelEditing}
                onSaveEditing={() => saveEdit(comment.id)}
                onDelete={() => handleDelete(comment)}
                commentMaxLength={commentMaxLength}
              />
            ))}
          </ul>
        )}

        {canComment ? (
          <form className="flex flex-col gap-2" onSubmit={submitNewComment}>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write a comment..."
              maxLength={commentMaxLength}
              rows={3}
              disabled={submitting}
              aria-label="Comment content"
            />
            {createError ? (
              <p className="text-xs text-destructive" role="alert">
                {createError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {content.trim().length} / {commentMaxLength}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || content.trim().length === 0}
              >
                {submitting ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </form>
        ) : isPublic && !isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/login?next=/analyses/${analysisId}`}
              className="underline-offset-4 hover:underline"
            >
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface CommentItemProps {
  comment: AnalysisCommentDto;
  error: string | null;
  isEditing: boolean;
  isManagementLocked: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onDelete: () => void;
  commentMaxLength: number;
}

function CommentItem({
  comment,
  error,
  isEditing,
  isManagementLocked,
  isSaving,
  isDeleting,
  editingContent,
  onEditingContentChange,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onDelete,
  commentMaxLength,
}: CommentItemProps) {
  const username = comment.author?.username ?? "Unknown user";
  const createdAt = new Date(comment.createdAt);
  const isBusy = isSaving || isDeleting;
  const canManage =
    comment.viewerPermissions.canEdit || comment.viewerPermissions.canDelete;

  function handleEditSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSaveEditing();
  }

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border bg-background/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
          {comment.author ? (
            <Link
              href={`/members/${encodeURIComponent(comment.author.username)}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {username}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{username}</span>
          )}
          <time dateTime={createdAt.toISOString()}>
            {formatTimestamp(createdAt)}
          </time>
          {comment.isEdited ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
              Edited
            </span>
          ) : null}
        </div>

        {!isEditing && canManage ? (
          <div className="flex items-center gap-1">
            {comment.viewerPermissions.canEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isBusy || isManagementLocked}
                onClick={onStartEditing}
              >
                Edit
              </Button>
            ) : null}
            {comment.viewerPermissions.canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isBusy || isManagementLocked}
                onClick={onDelete}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <form className="flex flex-col gap-2" onSubmit={handleEditSubmit}>
          <Textarea
            value={editingContent}
            onChange={(event) => onEditingContentChange(event.target.value)}
            rows={3}
            maxLength={commentMaxLength}
            disabled={isBusy}
            aria-label="Edit comment content"
          />
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {editingContent.trim().length} / {commentMaxLength}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={onCancelEditing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isBusy || editingContent.trim().length === 0}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </li>
  );
}
