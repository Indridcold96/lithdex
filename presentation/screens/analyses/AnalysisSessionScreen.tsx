import { notFound, redirect } from "next/navigation";

import type { AnalysisSessionDto } from "@/application/dto/AnalysisSessionDto";
import { ForbiddenError, NotFoundError } from "@/application/errors";
import { makeGetAnalysisSession } from "@/application/use-cases/get-analysis-session";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisResultRepository } from "@/infrastructure/database/repositories/PrismaAnalysisResultRepository";

import { AnalysisSessionClient } from "./AnalysisSessionClient";

interface AnalysisSessionScreenProps {
  id: string;
}

async function loadSession(
  id: string,
  userId: string
): Promise<AnalysisSessionDto | null> {
  const getAnalysisSession = makeGetAnalysisSession({
    analysisRepository: new PrismaAnalysisRepository(prisma),
    analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
    analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
      prisma
    ),
    analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
  });

  try {
    return await getAnalysisSession({ id, requesterUserId: userId });
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    if (error instanceof ForbiddenError) return null;
    throw error;
  }
}

export async function AnalysisSessionScreen({
  id,
}: AnalysisSessionScreenProps) {
  const userId = await getServerSessionUserId();
  if (!userId) {
    redirect(`/login?next=/analyses/${id}/session`);
  }

  const session = await loadSession(id, userId);
  if (!session) {
    notFound();
  }

  return <AnalysisSessionClient initialSession={session} />;
}
