import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { toAnalysisCommentDto } from "@/application/dto/AnalysisCommentDto";
import { makeAddAnalysisComment } from "@/application/use-cases/add-analysis-comment";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisCommentRepository } from "@/infrastructure/database/repositories/PrismaAnalysisCommentRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const AddAnalysisCommentSchema = z.object({
  content: z.string().min(1).max(4000),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId } = await ctx.params;
    const userId = await requireSessionUserId(request);

    const input = await parseBody(request, AddAnalysisCommentSchema);

    const userRepository = new PrismaUserRepository(prisma);
    const addAnalysisComment = makeAddAnalysisComment({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisCommentRepository: new PrismaAnalysisCommentRepository(prisma),
    });

    const comment = await addAnalysisComment({
      analysisId,
      userId,
      content: input.content,
    });

    const author = await userRepository.findById(userId);
    return NextResponse.json(toAnalysisCommentDto(comment, author), {
      status: 201,
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
