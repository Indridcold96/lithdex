import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ValidationError } from "@/application/errors";
import { makeRunAnalysisPass } from "@/application/use-cases/run-analysis-pass";
import { makeSubmitFollowupAndRun } from "@/application/use-cases/submit-followup-and-run";
import { makeSubmitFollowupAnswers } from "@/application/use-cases/submit-followup-answers";
import { makeUploadFollowupImages } from "@/application/use-cases/upload-followup-images";
import type { UploadedFileInput } from "@/application/use-cases/create-analysis-with-uploads";
import { NvidiaAIAnalysisProvider } from "@/infrastructure/ai/NvidiaAIAnalysisProvider";
import { prepareAnalysisImagesForAi } from "@/infrastructure/ai/prepareAnalysisImages";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisResultRepository } from "@/infrastructure/database/repositories/PrismaAnalysisResultRepository";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";
import { buildAnalysisImageStorageKey } from "@/infrastructure/storage/keys";

export const runtime = "nodejs";

const FollowupAnswersSchema = z.array(
  z.object({
    questionId: z.string().min(1).max(200),
    answer: z.string().min(1).max(2000),
  })
);

function isFile(entry: FormDataEntryValue): entry is File {
  return typeof entry === "object" && entry !== null && "arrayBuffer" in entry;
}

async function extractFiles(formData: FormData): Promise<UploadedFileInput[]> {
  const rawFiles = formData.getAll("files").filter(isFile);
  return Promise.all(
    rawFiles.map(async (file) => ({
      body: Buffer.from(await file.arrayBuffer()),
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
    }))
  );
}

function extractAnswers(formData: FormData) {
  const rawAnswers = formData.get("answers");
  if (rawAnswers === null) {
    return [];
  }
  if (typeof rawAnswers !== "string") {
    throw new ValidationError("Expected `answers` to be a JSON string field.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawAnswers);
  } catch {
    throw new ValidationError("Expected `answers` to contain valid JSON.");
  }

  return FollowupAnswersSchema.parse(parsed);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  try {
    const { id: analysisId } = await ctx.params;
    const requesterUserId = await requireSessionUserId(request);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ValidationError("Expected multipart/form-data payload.");
    }

    const answers = extractAnswers(formData);
    const files = await extractFiles(formData);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
    const analysisInteractionRepository = new PrismaAnalysisInteractionRepository(
      prisma
    );
    const fileStorage = new GcpFileStorage();

    const submitFollowupAndRun = makeSubmitFollowupAndRun({
      submitFollowupAnswers: makeSubmitFollowupAnswers({
        analysisRepository,
        analysisInteractionRepository,
      }),
      uploadFollowupImages: makeUploadFollowupImages({
        analysisRepository,
        analysisImageRepository,
        analysisInteractionRepository,
        fileStorage,
        buildStorageKey: buildAnalysisImageStorageKey,
      }),
      runAnalysisPass: makeRunAnalysisPass({
        analysisRepository,
        analysisImageRepository,
        analysisInteractionRepository,
        analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
        aiAnalysisProvider: new NvidiaAIAnalysisProvider(),
        fileStorage,
        prepareImages: prepareAnalysisImagesForAi,
      }),
    });

    const outcome = await submitFollowupAndRun({
      analysisId,
      requesterUserId,
      answers,
      files,
    });

    return NextResponse.json(outcome, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorToResponse(
        new ValidationError(
          error.issues[0]?.message ?? "Invalid follow-up answers."
        )
      );
    }
    return errorToResponse(error);
  }
}
