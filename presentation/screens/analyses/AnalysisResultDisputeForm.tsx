"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisStatus as Status } from "@/domain/enums/AnalysisStatus";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { Input } from "@/presentation/ui/input";
import { Textarea } from "@/presentation/ui/textarea";

interface AnalysisResultDisputeFormProps {
  analysisId: string;
  status: AnalysisStatus;
  isOwner: boolean;
}

const MAX_PROPOSED_IDENTIFICATION_LENGTH = 120;
const MAX_DISPUTE_REASON_LENGTH = 2000;

function canDispute(status: AnalysisStatus): boolean {
  return status === Status.COMPLETED || status === Status.INCONCLUSIVE;
}

export function AnalysisResultDisputeForm({
  analysisId,
  status,
  isOwner,
}: AnalysisResultDisputeFormProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [proposedIdentification, setProposedIdentification] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner || !canDispute(status)) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/result-dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedIdentification, reason }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not re-run the analysis.");
      }

      router.refresh();
      router.push(`/analyses/${analysisId}/session`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute AI result</CardTitle>
        <CardDescription>
          Add structured owner context and re-run the guided analysis. The
          dispute will remain in the analysis history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!expanded ? (
          <Button type="button" size="sm" onClick={() => setExpanded(true)}>
            Dispute AI result
          </Button>
        ) : (
          <form className="space-y-3" onSubmit={submit}>
            <div className="space-y-2">
              <label
                htmlFor="proposed-identification"
                className="text-sm font-medium"
              >
                Proposed identification
              </label>
              <Input
                id="proposed-identification"
                value={proposedIdentification}
                onChange={(event) =>
                  setProposedIdentification(event.target.value)
                }
                maxLength={MAX_PROPOSED_IDENTIFICATION_LENGTH}
                placeholder="e.g. Fluorite"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dispute-reason" className="text-sm font-medium">
                Reason or evidence
              </label>
              <Textarea
                id="dispute-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={MAX_DISPUTE_REASON_LENGTH}
                rows={4}
                placeholder="Add tests, provenance, observations, or later confirmation the AI should evaluate."
                disabled={submitting}
              />
            </div>

            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {reason.trim().length} / {MAX_DISPUTE_REASON_LENGTH}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => setExpanded(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    submitting ||
                    proposedIdentification.trim().length === 0 ||
                    reason.trim().length === 0
                  }
                >
                  {submitting ? "Re-running..." : "Re-run analysis"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
