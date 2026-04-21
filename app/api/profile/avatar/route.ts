import { NextResponse, type NextRequest } from "next/server";

import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { ValidationError } from "@/application/errors";
import { makeUpdateCurrentUserProfile } from "@/application/use-cases/update-current-user-profile";
import { makeUploadUserAvatar } from "@/application/use-cases/upload-user-avatar";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { errorToResponse } from "@/infrastructure/http/responses";
import { GcpFileStorage } from "@/infrastructure/storage/GcpFileStorage";
import { buildUserAvatarStorageKey } from "@/infrastructure/storage/keys";

export const runtime = "nodejs";

function isFile(entry: FormDataEntryValue | null): entry is File {
  return typeof entry === "object" && entry !== null && "arrayBuffer" in entry;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId(request);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ValidationError("Expected multipart/form-data payload.");
    }

    const entry = formData.get("file");
    if (!isFile(entry)) {
      throw new ValidationError("No avatar file was uploaded under the `file` field.");
    }

    const file = {
      body: Buffer.from(await entry.arrayBuffer()),
      mimeType: entry.type,
      size: entry.size,
    };

    const userRepository = new PrismaUserRepository(prisma);
    const updateCurrentUserProfile = makeUpdateCurrentUserProfile({
      userRepository,
    });
    const uploadUserAvatar = makeUploadUserAvatar({
      userRepository,
      fileStorage: new GcpFileStorage(),
      updateCurrentUserProfile,
      buildStorageKey: buildUserAvatarStorageKey,
    });

    const user = await uploadUserAvatar({
      userId,
      file,
    });

    return NextResponse.json(toAuthenticatedUserDto(user), { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
