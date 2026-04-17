"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";

import type { AnalysisFeedbackSummaryDto } from "@/application/dto/AnalysisDetailDto";
import { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";
import { cn } from "@/lib/utils";
import { Button } from "@/presentation/ui/button";

interface AnalysisFeedbackActionsProps {
  analysisId: string;
  enabled: boolean;
  isAuthenticated: boolean;
  initialCounts: AnalysisFeedbackSummaryDto;
  initialViewerFeedback: AnalysisFeedbackType | null;
}

interface FeedbackResponseBody {
  viewerFeedback: AnalysisFeedbackType;
  feedbackSummary: AnalysisFeedbackSummaryDto;
}

export function AnalysisFeedbackActions({
  analysisId,
  enabled,
  isAuthenticated,
  initialCounts,
  initialViewerFeedback,
}: AnalysisFeedbackActionsProps) {
  const [counts, setCounts] =
    useState<AnalysisFeedbackSummaryDto>(initialCounts);
  const [viewerFeedback, setViewerFeedback] =
    useState<AnalysisFeedbackType | null>(initialViewerFeedback);
  const [submitting, setSubmitting] = useState<AnalysisFeedbackType | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(type: AnalysisFeedbackType) {
    if (!enabled || !isAuthenticated) return;
    if (submitting) return;
    if (viewerFeedback === type) return;

    setSubmitting(type);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not submit feedback.");
      }
      const data = (await res.json()) as FeedbackResponseBody;
      setCounts(data.feedbackSummary);
      setViewerFeedback(data.viewerFeedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(null);
    }
  }

  const confirmActive = viewerFeedback === AnalysisFeedbackType.CONFIRM;
  const disputeActive = viewerFeedback === AnalysisFeedbackType.DISPUTE;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FeedbackButton
          label="Confirm"
          count={counts.confirmCount}
          active={confirmActive}
          disabled={!enabled}
          submitting={submitting === AnalysisFeedbackType.CONFIRM}
          onClick={() => submit(AnalysisFeedbackType.CONFIRM)}
          icon={<Check aria-hidden className="size-4" />}
          variant="confirm"
        />
        <FeedbackButton
          label="Dispute"
          count={counts.disputeCount}
          active={disputeActive}
          disabled={!enabled}
          submitting={submitting === AnalysisFeedbackType.DISPUTE}
          onClick={() => submit(AnalysisFeedbackType.DISPUTE)}
          icon={<X aria-hidden className="size-4" />}
          variant="dispute"
        />
      </div>

      {!isAuthenticated && enabled ? (
        <p className="text-xs text-muted-foreground">
          <Link
            href={`/login?next=/analyses/${analysisId}`}
            className="underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          to confirm or dispute this analysis.
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FeedbackButton({
  label,
  count,
  active,
  disabled,
  submitting,
  onClick,
  icon,
  variant,
}: {
  label: string;
  count: number;
  active: boolean;
  disabled: boolean;
  submitting: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  variant: "confirm" | "dispute";
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={disabled || submitting}
      aria-pressed={active}
      className={cn(
        "gap-2",
        active && variant === "confirm" &&
          "bg-emerald-600 text-white hover:bg-emerald-600/90",
        active && variant === "dispute" &&
          "bg-rose-600 text-white hover:bg-rose-600/90"
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-xs tabular-nums",
          active ? "bg-white/15" : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </Button>
  );
}
