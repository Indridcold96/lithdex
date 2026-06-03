"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type { AnalysisDto } from "@/application/dto/AnalysisDto";
import type { UserAnalysesPageDto } from "@/application/dto/UserAnalysesPageDto";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { useInfiniteUserAnalyses } from "@/presentation/hooks/useInfiniteUserAnalyses";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";

interface DashboardAnalysesFeedProps {
  initialPage: UserAnalysesPageDto;
  limit: number;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function DashboardAnalysesFeed({
  initialPage,
  limit,
}: DashboardAnalysesFeedProps) {
  const { items, totalCount, hasMore, loading, error, sentinelRef } =
    useInfiniteUserAnalyses({
      initialPage,
      limit,
    });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          Your analyses
        </h2>
        <span className="text-sm text-muted-foreground">
          Showing {items.length} of {totalCount}
        </span>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No analyses yet</CardTitle>
            <CardDescription>
              Upload a set of images to create your first analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              <span>You haven&apos;t created any analyses yet.</span>
              <Button
                size="sm"
                nativeButton={false}
                render={
                  <Link href="/analyses/new">
                    <Plus aria-hidden />
                    Start one now
                  </Link>
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((analysis) => (
              <DashboardAnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>

          {loading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading more analyses...
            </div>
          ) : null}

          {error ? (
            <div className="py-2 text-center text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {hasMore ? <div ref={sentinelRef} className="h-1 w-full" /> : null}
        </>
      )}
    </section>
  );
}

function DashboardAnalysisCard({ analysis }: { analysis: AnalysisDto }) {
  const cover = analysis.images[0];
  const extraCount = Math.max(analysis.images.length - 1, 0);
  const createdLabel = formatDate(new Date(analysis.createdAt));
  const isPublic = analysis.visibility === AnalysisVisibility.PUBLIC;

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
            <span
              className={
                "absolute top-2 left-2 rounded-md px-2 py-0.5 text-xs font-medium backdrop-blur " +
                (isPublic
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/90 text-muted-foreground")
              }
            >
              {isPublic ? "Public" : "Private"}
            </span>
          </div>
        ) : null}
        <CardHeader>
          <CardTitle className="text-base">
            {analysis.title ?? "Untitled analysis"}
          </CardTitle>
          <CardDescription>{createdLabel}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
