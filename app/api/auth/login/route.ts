import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { makeLoginUser } from "@/application/use-cases/login-user";
import { BcryptPasswordHasher } from "@/infrastructure/auth/BcryptPasswordHasher";
import { setSessionCookie } from "@/infrastructure/auth/cookies";
import { JoseSessionTokenService } from "@/infrastructure/auth/JoseSessionTokenService";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { assertSameOriginRequest } from "@/infrastructure/http/origin";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
    const input = await parseBody(request, LoginSchema);

    const userRepository = new PrismaUserRepository(prisma);
    const passwordHasher = new BcryptPasswordHasher();
    const loginUser = makeLoginUser({ userRepository, passwordHasher });

    const user = await loginUser(input);

    const tokenService = new JoseSessionTokenService();
    const token = await tokenService.sign({ sub: user.id, role: user.role });

    const response = NextResponse.json(toAuthenticatedUserDto(user), {
      status: 200,
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return errorToResponse(error);
  }
}
