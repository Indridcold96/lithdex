import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeSubmitFollowupAnswers } from "@/application/use-cases/submit-followup-answers";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const FollowupAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(200),
        answer: z.string().min(1).max(2000),
      })
    )
    .min(1),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId } = await ctx.params;
    const requesterUserId = await requireSessionUserId(request);

    const input = await parseBody(request, FollowupAnswersSchema);

    const submitFollowupAnswers = makeSubmitFollowupAnswers({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
        prisma
      ),
    });

    const interaction = await submitFollowupAnswers({
      analysisId,
      requesterUserId,
      answers: input.answers,
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
