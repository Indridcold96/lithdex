import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeListPublicAnalyses } from "@/application/use-cases/list-public-analyses";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { parseQuery } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const ListPublicAnalysesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { limit, cursor } = parseQuery(
      request.url,
      ListPublicAnalysesQuerySchema
    );

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
    const listPublicAnalyses = makeListPublicAnalyses({
      analysisRepository,
      analysisImageRepository,
    });

    const page = await listPublicAnalyses({ limit, cursor });
    return NextResponse.json(page, { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
