import { NextResponse, type NextRequest } from "next/server";

import { ValidationError } from "@/application/errors";
import {
  makeUploadFollowupImages,
  type UploadFollowupImagesInput,
} from "@/application/use-cases/upload-followup-images";
import type { UploadedFileInput } from "@/application/use-cases/create-analysis-with-uploads";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";
import { buildAnalysisImageStorageKey } from "@/infrastructure/storage/keys";

export const runtime = "nodejs";

function isFile(entry: FormDataEntryValue): entry is File {
  return typeof entry === "object" && entry !== null && "arrayBuffer" in entry;
}

async function extractFiles(
  formData: FormData
): Promise<UploadedFileInput[]> {
  const rawFiles = formData.getAll("files").filter(isFile);
  if (rawFiles.length === 0) {
    throw new ValidationError(
      "No files were uploaded under the `files` field."
    );
  }
  return Promise.all(
    rawFiles.map(async (file) => ({
      body: Buffer.from(await file.arrayBuffer()),
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
    }))
  );
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

    const files = await extractFiles(formData);

    const uploadFollowupImages = makeUploadFollowupImages({
      analysisRepository: new PrismaAnalysisRepository(prisma),
      analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
      analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
        prisma
      ),
      fileStorage: new GcpFileStorage(),
      buildStorageKey: buildAnalysisImageStorageKey,
    });

    const input: UploadFollowupImagesInput = {
      analysisId,
      requesterUserId,
      files,
    };
    const images = await uploadFollowupImages(input);
    return NextResponse.json({ images }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
