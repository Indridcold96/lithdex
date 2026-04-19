"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { AnalysisInteractionDto } from "@/application/dto/AnalysisInteractionDto";
import type { AnalysisRunOutcomeDto } from "@/application/dto/AnalysisRunOutcomeDto";
import type { AnalysisSessionDto } from "@/application/dto/AnalysisSessionDto";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";

function mergeInteractions(
  prior: AnalysisInteractionDto[],
  next: AnalysisInteractionDto[]
): AnalysisInteractionDto[] {
  const byId = new Map<string, AnalysisInteractionDto>();
  for (const item of prior) byId.set(item.id, item);
  for (const item of next) byId.set(item.id, item);
  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function useAnalysisSessionFlow(initialSession: AnalysisSessionDto) {
  const hasAutoStartedRef = useRef(false);
  const [session, setSession] = useState<AnalysisSessionDto>(initialSession);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { interactions, result, status } = session;

  async function refetchSession() {
    try {
      const res = await fetch(`/api/analyses/${session.id}/session`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const next = (await res.json()) as AnalysisSessionDto;
      setSession((prev) => ({
        ...next,
        interactions: mergeInteractions(prev.interactions, next.interactions),
      }));
    } catch {
      // Non-fatal; callers can continue using the current client state.
    }
  }

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${session.id}/run`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Analysis failed to run.");
      }

      const outcome = (await res.json()) as AnalysisRunOutcomeDto;
      void outcome;
      await refetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setRunning(false);
    }
  }

  const autoStartRun = useEffectEvent(() => {
    void run();
  });

  useEffect(() => {
    if (
      hasAutoStartedRef.current ||
      status !== AnalysisStatus.PROCESSING ||
      interactions.length > 0 ||
      result !== null ||
      running
    ) {
      return;
    }

    hasAutoStartedRef.current = true;
    autoStartRun();
  }, [interactions.length, result, running, status]);

  return {
    session,
    running,
    error,
    run,
    refetchSession,
  };
}
