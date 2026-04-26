import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie } from "@/infrastructure/auth/cookies";
import { assertSameOriginRequest } from "@/infrastructure/http/origin";
import { errorToResponse } from "@/infrastructure/http/responses";

export async function POST(request: NextRequest) {
  try {
    assertSameOriginRequest(request);
    const response = NextResponse.json({ ok: true }, { status: 200 });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return errorToResponse(error);
  }
}
