import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  DuplicateError,
  NotFoundError,
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

  console.error("Unexpected API error", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
