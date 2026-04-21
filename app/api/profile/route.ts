import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { makeUpdateCurrentUserProfile } from "@/application/use-cases/update-current-user-profile";
import { requireSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

export const runtime = "nodejs";

const UpdateProfileSchema = z.object({
  bio: z.string().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireSessionUserId(request);
    const input = await parseBody(request, UpdateProfileSchema);

    const userRepository = new PrismaUserRepository(prisma);
    const updateCurrentUserProfile = makeUpdateCurrentUserProfile({
      userRepository,
    });

    const user = await updateCurrentUserProfile({
      userId,
      bio: input.bio,
    });

    return NextResponse.json(toAuthenticatedUserDto(user), { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
