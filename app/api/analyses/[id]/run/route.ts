import { NextResponse, type NextRequest } from "next/server";

import { makeRunAnalysisPass } from "@/application/use-cases/run-analysis-pass";
import { NvidiaAIAnalysisProvider } from "@/infrastructure/ai/NvidiaAIAnalysisProvider";
import { prepareAnalysisImagesForAi } from "@/infrastructure/ai/prepareAnalysisImages";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisResultRepository } from "@/infrastructure/database/repositories/PrismaAnalysisResultRepository";
import { PrismaAnalysisTagRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagRepository";
import { PrismaTagRepository } from "@/infrastructure/database/repositories/PrismaTagRepository";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId } = await ctx.params;
    const requesterUserId = await requireSessionUserId(request);

    const runAnalysisPass = makeRunAnalysisPass({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
      analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
        prisma
      ),
      analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
      analysisTagRepository: new PrismaAnalysisTagRepository(prisma),
      tagRepository: new PrismaTagRepository(prisma),
      aiAnalysisProvider: new NvidiaAIAnalysisProvider(),
      fileStorage: new GcpFileStorage(),
      prepareImages: prepareAnalysisImagesForAi,
    });

    const outcome = await runAnalysisPass({
      analysisId,
      requesterUserId,
      assumeAlreadyProcessing: true,
    });
    return NextResponse.json(outcome, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
