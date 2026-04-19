import { NextResponse, type NextRequest } from "next/server";

import { makeGetAnalysisSession } from "@/application/use-cases/get-analysis-session";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisResultRepository } from "@/infrastructure/database/repositories/PrismaAnalysisResultRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const requesterUserId = await requireSessionUserId(request);

    const getAnalysisSession = makeGetAnalysisSession({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
      analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
        prisma
      ),
      analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
    });

    const dto = await getAnalysisSession({ id, requesterUserId });
    return NextResponse.json(dto, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
