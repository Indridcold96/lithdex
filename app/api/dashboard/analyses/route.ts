import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeListUserAnalyses } from "@/application/use-cases/list-user-analyses";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { parseQuery } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const ListDashboardAnalysesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId(request);
    const { limit, cursor } = parseQuery(
      request.url,
      ListDashboardAnalysesQuerySchema
    );

    const listUserAnalyses = makeListUserAnalyses({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
    });

    const page = await listUserAnalyses({ userId, limit, cursor });
    return NextResponse.json(page, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
