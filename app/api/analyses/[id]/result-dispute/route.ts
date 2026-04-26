import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeDisputeAnalysisResultAndRun } from "@/application/use-cases/dispute-analysis-result-and-run";
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
import { assertSameOriginRequest } from "@/infrastructure/http/origin";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";

export const runtime = "nodejs";

const DisputeAnalysisResultSchema = z.object({
  proposedIdentification: z.string(),
  reason: z.string(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    assertSameOriginRequest(request);
    const { id: analysisId } = await ctx.params;
    const requesterUserId = await requireSessionUserId(request);
    const input = await parseBody(request, DisputeAnalysisResultSchema);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
    const analysisInteractionRepository =
      new PrismaAnalysisInteractionRepository(prisma);
    const fileStorage = new GcpFileStorage();

    const disputeAnalysisResultAndRun = makeDisputeAnalysisResultAndRun({
      analysisRepository,
      analysisInteractionRepository,
      runAnalysisPass: makeRunAnalysisPass({
        analysisRepository,
        analysisImageRepository,
        analysisInteractionRepository,
        analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
        analysisTagRepository: new PrismaAnalysisTagRepository(prisma),
        tagRepository: new PrismaTagRepository(prisma),
        aiAnalysisProvider: new NvidiaAIAnalysisProvider(),
        fileStorage,
        prepareImages: prepareAnalysisImagesForAi,
      }),
    });

    const outcome = await disputeAnalysisResultAndRun({
      analysisId,
      requesterUserId,
      proposedIdentification: input.proposedIdentification,
      reason: input.reason,
    });

    return NextResponse.json(outcome, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
