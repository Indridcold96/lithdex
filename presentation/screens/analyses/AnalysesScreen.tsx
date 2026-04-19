import Link from "next/link";
import { Plus } from "lucide-react";

import type { PublicAnalysesPageDto } from "@/application/dto/PublicAnalysesPageDto";
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
import { PublicAnalysesFeed } from "./PublicAnalysesFeed";

const LIST_LIMIT = 20;

async function loadPublicAnalyses(): Promise<PublicAnalysesPageDto> {
  const analysisRepository = new PrismaAnalysisRepository(prisma);
  const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
  const listPublicAnalyses = makeListPublicAnalyses({
    analysisRepository,
    analysisImageRepository,
  });
  return listPublicAnalyses({ limit: LIST_LIMIT });
}

export async function AnalysesScreen() {
  const page = await loadPublicAnalyses();

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

      {page.items.length === 0 ? (
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
        <PublicAnalysesFeed initialPage={page} limit={LIST_LIMIT} />
      )}
    </div>
  );
}
