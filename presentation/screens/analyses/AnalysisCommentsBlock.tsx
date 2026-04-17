"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";

import type { AnalysisCommentDto } from "@/application/dto/AnalysisCommentDto";
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

const COMMENT_MAX_LENGTH = 4000;

export function AnalysisCommentsBlock({
  analysisId,
  isPublic,
  isAuthenticated,
  initialComments,
}: AnalysisCommentsBlockProps) {
  const [comments, setComments] =
    useState<AnalysisCommentDto[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canComment = isPublic && isAuthenticated;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canComment) return;
    const trimmed = content.trim();
    if (trimmed.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not post comment.");
      }
      const comment = (await res.json()) as AnalysisCommentDto;
      setComments((prev) => [...prev, comment]);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-sm text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        )}

        {canComment ? (
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              maxLength={COMMENT_MAX_LENGTH}
              rows={3}
              disabled={submitting}
              aria-label="Comment content"
            />
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {content.trim().length} / {COMMENT_MAX_LENGTH}
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

function CommentItem({ comment }: { comment: AnalysisCommentDto }) {
  const nickname = comment.author?.nickname ?? "Unknown user";
  const createdAt = new Date(comment.createdAt);

  return (
    <li className="flex flex-col gap-1 rounded-lg border border-border bg-background/50 p-3">
      <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{nickname}</span>
        <time dateTime={createdAt.toISOString()}>
          {formatTimestamp(createdAt)}
        </time>
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">
        {comment.content}
      </p>
    </li>
  );
}
