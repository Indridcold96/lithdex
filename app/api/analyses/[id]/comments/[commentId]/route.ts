import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { toAnalysisCommentDto } from "@/application/dto/AnalysisCommentDto";
import { makeDeleteAnalysisComment } from "@/application/use-cases/delete-analysis-comment";
import { makeUpdateAnalysisComment } from "@/application/use-cases/update-analysis-comment";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisCommentRepository } from "@/infrastructure/database/repositories/PrismaAnalysisCommentRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const UpdateAnalysisCommentSchema = z.object({
  content: z.string().min(1).max(4000),
});

interface RouteContext {
  params: Promise<{ id: string; commentId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId, commentId } = await ctx.params;
    const actingUserId = await requireSessionUserId(request);
    const input = await parseBody(request, UpdateAnalysisCommentSchema);

    const analysisCommentRepository = new PrismaAnalysisCommentRepository(
      prisma
    );
    const updateAnalysisComment = makeUpdateAnalysisComment({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisCommentRepository,
    });

    const comment = await updateAnalysisComment({
      analysisId,
      commentId,
      actingUserId,
      content: input.content,
    });

    const userRepository = new PrismaUserRepository(prisma);
    const author = await userRepository.findById(comment.userId);

    return NextResponse.json(
      toAnalysisCommentDto(comment, author, actingUserId),
      { status: 200 }
    );
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId, commentId } = await ctx.params;
    const actingUserId = await requireSessionUserId(request);

    const deleteAnalysisComment = makeDeleteAnalysisComment({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisCommentRepository: new PrismaAnalysisCommentRepository(prisma),
    });

    await deleteAnalysisComment({
      analysisId,
      commentId,
      actingUserId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
