import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import type {
  AnalysisFeedbackSummaryDto,
} from "@/application/dto/AnalysisDetailDto";
import { makeAddAnalysisFeedback } from "@/application/use-cases/add-analysis-feedback";
import { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisFeedbackRepository } from "@/infrastructure/database/repositories/PrismaAnalysisFeedbackRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { assertSameOriginRequest } from "@/infrastructure/http/origin";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const AddAnalysisFeedbackSchema = z.object({
  type: z.enum([AnalysisFeedbackType.CONFIRM, AnalysisFeedbackType.DISPUTE]),
});

interface FeedbackResponseBody {
  viewerFeedback: AnalysisFeedbackType;
  feedbackSummary: AnalysisFeedbackSummaryDto;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    assertSameOriginRequest(request);
    const { id: analysisId } = await ctx.params;
    const userId = await requireSessionUserId(request);

    const input = await parseBody(request, AddAnalysisFeedbackSchema);

    const analysisFeedbackRepository = new PrismaAnalysisFeedbackRepository(
      prisma
    );
    const addAnalysisFeedback = makeAddAnalysisFeedback({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisFeedbackRepository,
    });

    const feedback = await addAnalysisFeedback({
      analysisId,
      userId,
      type: input.type,
    });

    const counts = await analysisFeedbackRepository.countByType(analysisId);

    const body: FeedbackResponseBody = {
      viewerFeedback: feedback.type,
      feedbackSummary: {
        confirmCount: counts.confirm,
        disputeCount: counts.dispute,
      },
    };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
