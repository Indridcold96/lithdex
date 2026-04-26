import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeSetAnalysisVisibility } from "@/application/use-cases/set-analysis-visibility";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { assertSameOriginRequest } from "@/infrastructure/http/origin";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const SetAnalysisVisibilitySchema = z.object({
  visibility: z.enum([AnalysisVisibility.PUBLIC, AnalysisVisibility.PRIVATE]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    assertSameOriginRequest(request);
    const { id: analysisId } = await ctx.params;
    const requesterUserId = await requireSessionUserId(request);
    const input = await parseBody(request, SetAnalysisVisibilitySchema);

    const setAnalysisVisibility = makeSetAnalysisVisibility({
      analysisRepository: new PrismaAnalysisRepository(prisma),
    });

    const analysis = await setAnalysisVisibility({
      analysisId,
      requesterUserId,
      visibility: input.visibility,
    });

    return NextResponse.json(
      {
        id: analysis.id,
        status: analysis.status,
        visibility: analysis.visibility,
        publishedAt: analysis.publishedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
