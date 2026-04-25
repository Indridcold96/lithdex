"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { AnalysisDto } from "@/application/dto/AnalysisDto";
import type { PublicAnalysesPageDto } from "@/application/dto/PublicAnalysesPageDto";

interface UseInfinitePublicAnalysesInput {
  initialPage: PublicAnalysesPageDto;
  limit: number;
  searchQuery?: string;
}

function mergeUniqueAnalyses(
  prior: AnalysisDto[],
  next: AnalysisDto[]
): AnalysisDto[] {
  const byId = new Map<string, AnalysisDto>();
  for (const item of prior) byId.set(item.id, item);
  for (const item of next) byId.set(item.id, item);
  return Array.from(byId.values());
}

export function useInfinitePublicAnalyses({
  initialPage,
  limit,
  searchQuery,
}: UseInfinitePublicAnalysesInput) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialPage.items);
    setNextCursor(initialPage.nextCursor);
    setHasMore(initialPage.hasMore);
    setError(null);
  }, [initialPage]);

  const loadMoreEvent = useEffectEvent(() => {
    void loadMore();
  });

  useEffect(() => {
    if (!hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loading || !hasMore || !nextCursor) {
          return;
        }

        loadMoreEvent();
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, nextCursor]);

  async function loadMore() {
    if (loading || !hasMore || !nextCursor) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        cursor: nextCursor,
      });
      const normalizedSearchQuery = searchQuery?.trim();
      if (normalizedSearchQuery) {
        params.set("q", normalizedSearchQuery);
      }
      const res = await fetch(`/api/analyses/public?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not load more analyses.");
      }

      const page = (await res.json()) as PublicAnalysesPageDto;
      setItems((prev) => mergeUniqueAnalyses(prev, page.items));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load more analyses."
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    items,
    hasMore,
    loading,
    error,
    sentinelRef,
  };
}
