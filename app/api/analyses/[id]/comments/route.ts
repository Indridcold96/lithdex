import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeAddAnalysisComment } from "@/application/use-cases/add-analysis-comment";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisCommentRepository } from "@/infrastructure/database/repositories/PrismaAnalysisCommentRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

const AddAnalysisCommentSchema = z.object({
  userId: z.string().min(1),
  content: z.string(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id: analysisId } = await ctx.params;

  try {
    const input = await parseBody(request, AddAnalysisCommentSchema);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisCommentRepository = new PrismaAnalysisCommentRepository(
      prisma
    );
    const addAnalysisComment = makeAddAnalysisComment({
      analysisRepository,
      analysisCommentRepository,
    });

    const comment = await addAnalysisComment({
      analysisId,
      userId: input.userId,
      content: input.content,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
