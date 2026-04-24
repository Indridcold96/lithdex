import { NextResponse, type NextRequest } from "next/server";

import { makeGetAnalysisDetail } from "@/application/use-cases/get-analysis-detail";
import { getOptionalSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisCommentRepository } from "@/infrastructure/database/repositories/PrismaAnalysisCommentRepository";
import { PrismaAnalysisFeedbackRepository } from "@/infrastructure/database/repositories/PrismaAnalysisFeedbackRepository";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisResultRepository } from "@/infrastructure/database/repositories/PrismaAnalysisResultRepository";
import { PrismaAnalysisTagRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagRepository";
import { PrismaAnalysisTagSuggestionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagSuggestionRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const viewerUserId = await getOptionalSessionUserId(request);

    const getAnalysisDetail = makeGetAnalysisDetail({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
      analysisCommentRepository: new PrismaAnalysisCommentRepository(prisma),
      analysisFeedbackRepository: new PrismaAnalysisFeedbackRepository(prisma),
      analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
      analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
        prisma
      ),
      analysisTagRepository: new PrismaAnalysisTagRepository(prisma),
      analysisTagSuggestionRepository:
        new PrismaAnalysisTagSuggestionRepository(prisma),
      userRepository: new PrismaUserRepository(prisma),
    });

    const dto = await getAnalysisDetail({ id, viewerUserId });
    return NextResponse.json(dto, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
