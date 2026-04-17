import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeAddAnalysisFeedback } from "@/application/use-cases/add-analysis-feedback";
import { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisFeedbackRepository } from "@/infrastructure/database/repositories/PrismaAnalysisFeedbackRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

const AddAnalysisFeedbackSchema = z.object({
  userId: z.cuid(),
  type: z.enum([AnalysisFeedbackType.CONFIRM, AnalysisFeedbackType.DISPUTE]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id: analysisId } = await ctx.params;

  try {
    const input = await parseBody(request, AddAnalysisFeedbackSchema);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisFeedbackRepository = new PrismaAnalysisFeedbackRepository(
      prisma
    );
    const addAnalysisFeedback = makeAddAnalysisFeedback({
      analysisRepository,
      analysisFeedbackRepository,
    });

    const feedback = await addAnalysisFeedback({
      analysisId,
      userId: input.userId,
      type: input.type,
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
