import { NextResponse, type NextRequest } from "next/server";

import { makeRejectAnalysisTagSuggestion } from "@/application/use-cases/reject-analysis-tag-suggestion";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
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

    const rejectAnalysisTagSuggestion = makeRejectAnalysisTagSuggestion({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisTagSuggestionRepository:
        new PrismaAnalysisTagSuggestionRepository(prisma),
    });

    const suggestion = await rejectAnalysisTagSuggestion({
      analysisId,
      suggestionId,
      reviewerUserId,
    });

    return NextResponse.json(
      {
        suggestionId: suggestion.id,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
