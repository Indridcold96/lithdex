import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/application/username";
import { toAuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { makeRegisterUser } from "@/application/use-cases/register-user";
import { BcryptPasswordHasher } from "@/infrastructure/auth/BcryptPasswordHasher";
import { setSessionCookie } from "@/infrastructure/auth/cookies";
import { JoseSessionTokenService } from "@/infrastructure/auth/JoseSessionTokenService";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import { parseBody } from "@/infrastructure/http/request";
import { errorToResponse } from "@/infrastructure/http/responses";

const RegisterSchema = z.object({
  email: z.email(),
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const input = await parseBody(request, RegisterSchema);

    const userRepository = new PrismaUserRepository(prisma);
    const passwordHasher = new BcryptPasswordHasher();
    const registerUser = makeRegisterUser({ userRepository, passwordHasher });

    const user = await registerUser(input);

    const tokenService = new JoseSessionTokenService();
    const token = await tokenService.sign({ sub: user.id, role: user.role });

    const response = NextResponse.json(toAuthenticatedUserDto(user), {
      status: 201,
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return errorToResponse(error);
  }
}
