import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  AIProviderError,
  ConflictError,
  DuplicateError,
  ForbiddenError,
  InvalidCredentialsError,
  NotFoundError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from "@/application/errors";

export function badRequest(message = "Invalid input") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function errorToResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", issues: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof DuplicateError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (
    error instanceof UnauthenticatedError ||
    error instanceof InvalidCredentialsError
  ) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }
  if (error instanceof AIProviderError) {
    // Do not leak raw provider payloads; `message` is already sanitized by the
    // provider wrapper before being surfaced as this error type.
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  console.error("Unexpected API error", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
