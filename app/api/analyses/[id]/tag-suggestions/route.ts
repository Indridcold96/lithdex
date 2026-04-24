import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { toAnalysisTagSuggestionDto } from "@/application/dto/AnalysisTagSuggestionDto";
import { toPublicUserDto } from "@/application/dto/AuthenticatedUserDto";
import { makeSuggestAnalysisTag } from "@/application/use-cases/suggest-analysis-tag";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisTagRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagRepository";
import { PrismaAnalysisTagSuggestionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisTagSuggestionRepository";
import { PrismaTagRepository } from "@/infrastructure/database/repositories/PrismaTagRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const SuggestAnalysisTagSchema = z.object({
  tag: z.string().min(1).max(80),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId } = await ctx.params;
    const userId = await requireSessionUserId(request);
    const input = await parseBody(request, SuggestAnalysisTagSchema);

    const userRepository = new PrismaUserRepository(prisma);
    const suggestAnalysisTag = makeSuggestAnalysisTag({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisTagRepository: new PrismaAnalysisTagRepository(prisma),
      analysisTagSuggestionRepository:
        new PrismaAnalysisTagSuggestionRepository(prisma),
      tagRepository: new PrismaTagRepository(prisma),
    });

    const suggestion = await suggestAnalysisTag({
      analysisId,
      userId,
      tag: input.tag,
    });

    const user = await userRepository.findById(userId);

    return NextResponse.json(
      {
        suggestion: toAnalysisTagSuggestionDto(
          suggestion,
          user ? toPublicUserDto(user) : null
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
