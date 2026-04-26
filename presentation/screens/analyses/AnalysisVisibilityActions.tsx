"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, Lock, ShieldCheck } from "lucide-react";

import type { AnalysisVisibility as AnalysisVisibilityValue } from "@/domain/enums/AnalysisVisibility";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisStatus as Status } from "@/domain/enums/AnalysisStatus";
import { Button } from "@/presentation/ui/button";

interface VisibilityResponseBody {
  id: string;
  status: AnalysisStatus;
  visibility: AnalysisVisibilityValue;
  publishedAt: string | Date | null;
}

interface AnalysisVisibilityActionsProps {
  analysisId: string;
  status: AnalysisStatus;
  initialVisibility: AnalysisVisibilityValue;
  initialPublishedAt: Date | null;
  isOwner: boolean;
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={
        "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase " +
        (isPublic
          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "bg-slate-500/10 text-slate-700 dark:text-slate-300")
      }
    >
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

function formatPublishedDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AnalysisVisibilityActions({
  analysisId,
  status,
  initialVisibility,
  initialPublishedAt,
  isOwner,
}: AnalysisVisibilityActionsProps) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initialVisibility);
  const [publishedAt, setPublishedAt] = useState<Date | null>(
    initialPublishedAt
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublic = visibility === AnalysisVisibility.PUBLIC;
  const canPublish =
    isOwner &&
    (status === Status.COMPLETED || status === Status.INCONCLUSIVE) &&
    !isPublic;
  const canUnpublish = isOwner && isPublic;

  async function submit(nextVisibility: AnalysisVisibilityValue) {
    if (submitting) return;

    if (
      nextVisibility === AnalysisVisibility.PRIVATE &&
      !window.confirm(
        "Make this analysis private and remove it from the public library?"
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVisibility }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not update analysis visibility.");
      }

      const data = (await res.json()) as VisibilityResponseBody;
      setVisibility(data.visibility);
      setPublishedAt(data.publishedAt ? new Date(data.publishedAt) : null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  const helperText = isPublic
    ? "This analysis is currently visible in the public library."
    : status === Status.COMPLETED || status === Status.INCONCLUSIVE
      ? "Publish this analysis to make it discoverable in the public library."
      : "Only completed or inconclusive analyses can be published to the public library.";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <VisibilityBadge isPublic={isPublic} />
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Owner controls
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Library visibility
            </p>
            <p className="max-w-xl text-sm text-muted-foreground">
              {helperText}
            </p>
          </div>
        </div>

        {publishedAt ? (
          <div className="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Published
            </p>
            <p className="text-sm font-medium text-foreground">
              {formatPublishedDate(publishedAt)}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/60 px-3 py-2 text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Library status
            </p>
            <p className="text-sm font-medium text-foreground">Not published</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck aria-hidden className="size-3.5" />
        <span>You can control whether this analysis appears in the public library.</span>
      </div>

      {canPublish ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            className="self-start"
            disabled={submitting}
            onClick={() => submit(AnalysisVisibility.PUBLIC)}
          >
            <Globe aria-hidden />
            {submitting ? "Publishing..." : "Publish to public library"}
          </Button>
          <p className="text-xs text-muted-foreground">
            This will make the analysis visible in public library listings.
          </p>
        </div>
      ) : null}

      {canUnpublish ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={submitting}
            onClick={() => submit(AnalysisVisibility.PRIVATE)}
          >
            <Lock aria-hidden />
            {submitting ? "Saving..." : "Make private"}
          </Button>
          <p className="text-xs text-muted-foreground">
            This removes the analysis from the public library.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
