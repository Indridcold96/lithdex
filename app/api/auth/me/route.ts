import { NextResponse, type NextRequest } from "next/server";

import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { UnauthenticatedError } from "@/application/errors";
import { makeGetCurrentUser } from "@/application/use-cases/get-current-user";
import { readSessionCookie } from "@/infrastructure/auth/cookies";
import { JoseSessionTokenService } from "@/infrastructure/auth/JoseSessionTokenService";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { errorToResponse } from "@/infrastructure/http/responses";

export async function GET(request: NextRequest) {
  try {
    const token = readSessionCookie(request);
    if (!token) {
      throw new UnauthenticatedError("Not authenticated.");
    }

    const tokenService = new JoseSessionTokenService();
    const session = await tokenService.verify(token);
    if (!session) {
      throw new UnauthenticatedError("Session is invalid or expired.");
    }

    const userRepository = new PrismaUserRepository(prisma);
    const getCurrentUser = makeGetCurrentUser({ userRepository });

    const user = await getCurrentUser(session.sub);
    return NextResponse.json(toAuthenticatedUserDto(user), { status: 200 });
  } catch (error) {
    return errorToResponse(error);
  }
}
