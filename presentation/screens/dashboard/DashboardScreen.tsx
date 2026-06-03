import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import type { AuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import type { UserAnalysesPageDto } from "@/application/dto/UserAnalysesPageDto";
import { makeGetCurrentUser } from "@/application/use-cases/auth/get-current-user";
import { makeListUserAnalyses } from "@/application/use-cases/analyses/list-user-analyses";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { Button } from "@/presentation/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/presentation/ui/card";
import { PageHeader } from "@/presentation/components/PageHeader";

import { DashboardAnalysesFeed } from "./DashboardAnalysesFeed";
import { SignOutButton } from "./SignOutButton";

const DASHBOARD_LIMIT = 24;

interface DashboardData {
  user: AuthenticatedUserDto;
  analysesPage: UserAnalysesPageDto;
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
    const analysesPage = await listUserAnalyses({
      userId,
      limit: DASHBOARD_LIMIT,
    });
    return { user: toAuthenticatedUserDto(user), analysesPage };
  } catch {
    return null;
  }
}

export async function DashboardScreen() {
  const data = await loadDashboard();
  if (!data) {
    redirect("/login?next=/dashboard");
  }

  const { user, analysesPage } = data;

  const stats = [
    { label: "Your analyses", value: String(analysesPage.counts.total) },
    { label: "Public", value: String(analysesPage.counts.public) },
    { label: "Private", value: String(analysesPage.counts.private) },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.username}.`}
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

      <DashboardAnalysesFeed
        initialPage={analysesPage}
        limit={DASHBOARD_LIMIT}
      />
    </div>
  );
}
