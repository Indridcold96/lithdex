import { NextResponse, type NextRequest } from "next/server";

import { toAnalysisTagDto } from "@/application/dto/AnalysisTagDto";
import { makeAcceptAnalysisTagSuggestion } from "@/application/use-cases/accept-analysis-tag-suggestion";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisTagRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagRepository";
import { PrismaAnalysisTagSuggestionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagSuggestionRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string; suggestionId: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId, suggestionId } = await ctx.params;
    const reviewerUserId = await requireSessionUserId(request);

    const acceptAnalysisTagSuggestion = makeAcceptAnalysisTagSuggestion({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisTagRepository: new PrismaAnalysisTagRepository(prisma),
      analysisTagSuggestionRepository:
        new PrismaAnalysisTagSuggestionRepository(prisma),
    });

    const result = await acceptAnalysisTagSuggestion({
      analysisId,
      suggestionId,
      reviewerUserId,
    });

    return NextResponse.json(
      {
        suggestionId: result.suggestion.id,
        appliedTag: toAnalysisTagDto(result.appliedTag),
      },
      { status: 200 }
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
