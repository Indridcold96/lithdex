import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { makeCreateAnalysis } from "@/application/use-cases/create-analysis";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

const CreateAnalysisImageSchema = z.object({
  storageKey: z.string().min(1),
  originalFilename: z.string().nullish(),
  mimeType: z.string().nullish(),
  sortOrder: z.number().finite().optional(),
});

const CreateAnalysisSchema = z.object({
  userId: z.string().nullish(),
  title: z.string().nullish(),
  visibility: z
    .enum([AnalysisVisibility.PUBLIC, AnalysisVisibility.PRIVATE])
    .optional(),
  images: z.array(CreateAnalysisImageSchema),
});

export async function POST(request: NextRequest) {
  try {
    const input = await parseBody(request, CreateAnalysisSchema);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const createAnalysis = makeCreateAnalysis({ analysisRepository });

    const analysis = await createAnalysis({
      userId: input.userId ?? null,
      title: input.title ?? null,
      visibility: input.visibility,
      images: input.images.map((image) => ({
        storageKey: image.storageKey,
        originalFilename: image.originalFilename ?? null,
        mimeType: image.mimeType ?? null,
        sortOrder: image.sortOrder,
      })),
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
