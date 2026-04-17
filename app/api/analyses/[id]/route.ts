import { NextResponse, type NextRequest } from "next/server";

import { makeGetAnalysisById } from "@/application/use-cases/get-analysis-by-id";
import { getOptionalSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const viewerUserId = await getOptionalSessionUserId(request);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
    const getAnalysisById = makeGetAnalysisById({
      analysisRepository,
      analysisImageRepository,
    });

    const dto = await getAnalysisById({ id, viewerUserId });
    return NextResponse.json(dto, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
