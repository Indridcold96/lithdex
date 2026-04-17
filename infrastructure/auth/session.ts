import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { UnauthenticatedError } from "@/application/errors";

import { readSessionCookie } from "./cookies";
import { SESSION_COOKIE_NAME } from "./env";
import { JoseSessionTokenService } from "./JoseSessionTokenService";

const tokenService = new JoseSessionTokenService();

export async function getOptionalSessionUserId(
  request: NextRequest
): Promise<string | null> {
  const token = readSessionCookie(request);
  if (!token) return null;

  const payload = await tokenService.verify(token);
  return payload?.sub ?? null;
}

export async function requireSessionUserId(
  request: NextRequest
): Promise<string> {
  const userId = await getOptionalSessionUserId(request);
  if (!userId) {
    throw new UnauthenticatedError("Authentication required.");
  }
  return userId;
}

export async function getServerSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await tokenService.verify(token);
  return payload?.sub ?? null;
}
