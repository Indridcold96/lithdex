"use client";

import Link from "next/link";

import type { AnalysisDto } from "@/application/dto/AnalysisDto";
import type { PublicAnalysesPageDto } from "@/application/dto/PublicAnalysesPageDto";
import { useInfinitePublicAnalyses } from "@/presentation/hooks/useInfinitePublicAnalyses";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";

interface PublicAnalysesFeedProps {
  initialPage: PublicAnalysesPageDto;
  limit: number;
  searchQuery?: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function PublicAnalysesFeed({
  initialPage,
  limit,
  searchQuery,
}: PublicAnalysesFeedProps) {
  const { items, hasMore, loading, error, sentinelRef } =
    useInfinitePublicAnalyses({
      initialPage,
      limit,
      searchQuery,
    });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>

      {loading ? (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Loading more analyses...
        </div>
      ) : null}

      {error ? (
        <div className="py-2 text-center text-sm text-destructive">{error}</div>
      ) : null}

      {hasMore ? <div ref={sentinelRef} className="h-1 w-full" /> : null}
    </>
  );
}

function AnalysisCard({ analysis }: { analysis: AnalysisDto }) {
  const cover = analysis.images[0];
  const extraCount = Math.max(analysis.images.length - 1, 0);
  const createdLabel = formatDate(new Date(analysis.createdAt));

  return (
    <Link
      href={`/analyses/${analysis.id}`}
      className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Card className="overflow-hidden transition group-hover:border-foreground/30">
        {cover ? (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt={cover.originalFilename ?? "Analysis cover image"}
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
            {extraCount > 0 ? (
              <span className="absolute right-2 bottom-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
                +{extraCount} more
              </span>
            ) : null}
          </div>
        ) : null}
        <CardHeader>
          <CardTitle className="text-base">
            {analysis.title ?? "Untitled analysis"}
          </CardTitle>
          {analysis.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {analysis.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.slug}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}
          <CardDescription>{createdLabel}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
