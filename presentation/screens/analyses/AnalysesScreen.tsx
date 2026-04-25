import Link from "next/link";
import { Plus } from "lucide-react";

import type { PublicAnalysesPageDto } from "@/application/dto/PublicAnalysesPageDto";
import { makeListPublicAnalyses } from "@/application/use-cases/list-public-analyses";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisTagRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagRepository";
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
import { PublicAnalysesSearch } from "./PublicAnalysesSearch";

const LIST_LIMIT = 20;

interface AnalysesScreenProps {
  searchQuery?: string;
}

async function loadPublicAnalyses(
  searchQuery?: string
): Promise<PublicAnalysesPageDto> {
  const analysisRepository = new PrismaAnalysisRepository(prisma);
  const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
  const analysisTagRepository = new PrismaAnalysisTagRepository(prisma);
  const listPublicAnalyses = makeListPublicAnalyses({
    analysisRepository,
    analysisImageRepository,
    analysisTagRepository,
  });
  return listPublicAnalyses({ limit: LIST_LIMIT, searchQuery });
}

export async function AnalysesScreen({ searchQuery }: AnalysesScreenProps) {
  const page = await loadPublicAnalyses(searchQuery);
  const hasSearch =
    typeof searchQuery === "string" && searchQuery.trim().length > 0;

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

      <PublicAnalysesSearch initialQuery={searchQuery ?? ""} />

      {page.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {hasSearch ? "No matching analyses" : "No analyses yet"}
            </CardTitle>
            <CardDescription>
              {hasSearch
                ? "Try a different title, author, or tag."
                : "When someone publishes a new analysis, it will appear here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              {hasSearch
                ? "No public completed analyses matched this search."
                : "Be the first to publish one."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <PublicAnalysesFeed
          initialPage={page}
          limit={LIST_LIMIT}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
