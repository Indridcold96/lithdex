import { NextResponse, type NextRequest } from "next/server";

import {
  makeCreateAnalysisWithUploads,
  type UploadedFileInput,
} from "@/application/use-cases/create-analysis-with-uploads";
import { ValidationError } from "@/application/errors";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { assertSameOriginRequest } from "@/infrastructure/http/origin";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";
import { buildAnalysisImageStorageKey } from "@/infrastructure/storage/keys";

export const runtime = "nodejs";

function parseOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseVisibilityField(
  value: FormDataEntryValue | null
): AnalysisVisibility | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  if (
    value === AnalysisVisibility.PUBLIC ||
    value === AnalysisVisibility.PRIVATE
  ) {
    return value;
  }
  throw new ValidationError(`Unsupported visibility: ${value}`);
}

async function extractFiles(
  formData: FormData
): Promise<UploadedFileInput[]> {
  const rawFiles = formData.getAll("files").filter(isFile);
  if (rawFiles.length === 0) {
    throw new ValidationError("No files were uploaded under the `files` field.");
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

function isFile(entry: FormDataEntryValue): entry is File {
  return typeof entry === "object" && entry !== null && "arrayBuffer" in entry;
}

export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
    const userId = await requireSessionUserId(request);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ValidationError("Expected multipart/form-data payload.");
    }

    const title = parseOptionalString(formData.get("title"));
    const visibility = parseVisibilityField(formData.get("visibility"));
    const files = await extractFiles(formData);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
    const fileStorage = new GcpFileStorage();

    const createAnalysisWithUploads = makeCreateAnalysisWithUploads({
      analysisRepository,
      analysisImageRepository,
      fileStorage,
      buildStorageKey: buildAnalysisImageStorageKey,
    });

    const dto = await createAnalysisWithUploads({
      userId,
      title,
      visibility,
      files,
    });

    return NextResponse.json(dto, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
