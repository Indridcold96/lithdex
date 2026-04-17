import Link from "next/link";
import { Plus } from "lucide-react";

import type { AnalysisDto } from "@/application/dto/AnalysisDto";
import { makeListPublicAnalyses } from "@/application/use-cases/list-public-analyses";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

const LIST_LIMIT = 20;

async function loadPublicAnalyses(): Promise<AnalysisDto[]> {
  const analysisRepository = new PrismaAnalysisRepository(prisma);
  const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
  const listPublicAnalyses = makeListPublicAnalyses({
    analysisRepository,
    analysisImageRepository,
  });
  return listPublicAnalyses({ limit: LIST_LIMIT });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export async function AnalysesScreen() {
  const analyses = await loadPublicAnalyses();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Analyses"
        description="Browse public identification attempts from the community."
        actions={
          <Button
            size="sm"
            nativeButton={false}
            render={
              <Link href="/analyses/new">
                <Plus aria-hidden />
                New analysis
              </Link>
            }
          />
        }
      />

      {analyses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No analyses yet</CardTitle>
            <CardDescription>
              When someone publishes a new analysis, it will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Be the first to publish one.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: AnalysisDto }) {
  const cover = analysis.images[0];
  const extraCount = Math.max(analysis.images.length - 1, 0);
  const createdLabel = formatDate(new Date(analysis.createdAt));

  return (
    <Card className="overflow-hidden">
      {cover ? (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt={cover.originalFilename ?? "Analysis cover image"}
            className="h-full w-full object-cover"
          />
          {extraCount > 0 ? (
            <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur">
              +{extraCount} more
            </span>
          ) : null}
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="text-base">
          {analysis.title ?? "Untitled analysis"}
        </CardTitle>
        <CardDescription>{createdLabel}</CardDescription>
      </CardHeader>
    </Card>
  );
}
