import { NextResponse, type NextRequest } from "next/server";

import { makeGetAnalysisById } from "@/application/use-cases/get-analysis-by-id";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;

  const analysisRepository = new PrismaAnalysisRepository(prisma);
  const getAnalysisById = makeGetAnalysisById({ analysisRepository });

  try {
    const analysis = await getAnalysisById(id);
    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
