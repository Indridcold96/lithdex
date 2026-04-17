import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import type { AnalysisDto } from "@/application/dto/AnalysisDto";
import type { AuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { makeGetCurrentUser } from "@/application/use-cases/get-current-user";
import { makeListUserAnalyses } from "@/application/use-cases/list-user-analyses";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

import { SignOutButton } from "./SignOutButton";

const DASHBOARD_LIMIT = 24;

interface DashboardData {
  user: AuthenticatedUserDto;
  analyses: AnalysisDto[];
}

async function loadDashboard(): Promise<DashboardData | null> {
  const userId = await getServerSessionUserId();
  if (!userId) return null;

  const userRepository = new PrismaUserRepository(prisma);
  const analysisRepository = new PrismaAnalysisRepository(prisma);
  const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);

  const getCurrentUser = makeGetCurrentUser({ userRepository });
  const listUserAnalyses = makeListUserAnalyses({
    analysisRepository,
    analysisImageRepository,
  });

  try {
    const user = await getCurrentUser(userId);
    const analyses = await listUserAnalyses({
      userId,
      limit: DASHBOARD_LIMIT,
    });
    return { user: toAuthenticatedUserDto(user), analyses };
  } catch {
    return null;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export async function DashboardScreen() {
  const data = await loadDashboard();
  if (!data) {
    redirect("/login?next=/dashboard");
  }

  const { user, analyses } = data;

  const publicCount = analyses.filter(
    (a) => a.visibility === AnalysisVisibility.PUBLIC
  ).length;
  const privateCount = analyses.length - publicCount;

  const stats = [
    { label: "Your analyses", value: String(analyses.length) },
    { label: "Public", value: String(publicCount) },
    { label: "Private", value: String(privateCount) },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.nickname}.`}
        actions={
          <div className="flex items-center gap-2">
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
            <SignOutButton />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Your analyses
          </h2>
          <span className="text-sm text-muted-foreground">
            Showing the most recent {Math.min(analyses.length, DASHBOARD_LIMIT)}
          </span>
        </div>

        {analyses.length === 0 ? (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => (
              <DashboardAnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardAnalysisCard({ analysis }: { analysis: AnalysisDto }) {
  const cover = analysis.images[0];
  const extraCount = Math.max(analysis.images.length - 1, 0);
  const createdLabel = formatDate(new Date(analysis.createdAt));
  const isPublic = analysis.visibility === AnalysisVisibility.PUBLIC;

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
  );
}
