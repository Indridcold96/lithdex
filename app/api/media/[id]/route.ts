import { Readable } from "node:stream";

import { NextResponse, type NextRequest } from "next/server";

import { makeAccessAnalysisImage } from "@/application/use-cases/access-analysis-image";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { getOptionalSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const viewerUserId = await getOptionalSessionUserId(request);

    const analysisRepository = new PrismaAnalysisRepository(prisma);
    const analysisImageRepository = new PrismaAnalysisImageRepository(prisma);
    const accessAnalysisImage = makeAccessAnalysisImage({
      analysisRepository,
      analysisImageRepository,
    });

    const { image, analysis } = await accessAnalysisImage({
      imageId: id,
      viewerUserId,
    });

    const fileStorage = new GcpFileStorage();
    const { body, contentType, contentLength } = await fileStorage.read(
      image.storageKey
    );

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control":
        analysis.visibility === AnalysisVisibility.PUBLIC
          ? "public, max-age=3600"
          : "private, max-age=0, no-store",
    });
    if (contentLength !== null) {
      headers.set("Content-Length", String(contentLength));
    }

    const webStream = Readable.toWeb(body) as ReadableStream<Uint8Array>;
    return new NextResponse(webStream, { status: 200, headers });
  } catch (error) {
    return errorToResponse(error);
  }
}
