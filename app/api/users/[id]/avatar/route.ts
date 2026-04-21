import { Readable } from "node:stream";

import { NextResponse, type NextRequest } from "next/server";

import { makeAccessUserAvatar } from "@/application/use-cases/access-user-avatar";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    const accessUserAvatar = makeAccessUserAvatar({
      userRepository: new PrismaUserRepository(prisma),
    });
    const user = await accessUserAvatar({ userId: id });

    const fileStorage = new GcpFileStorage();
    const { body, contentType, contentLength } = await fileStorage.read(
      user.avatarUrl as string
    );

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
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
