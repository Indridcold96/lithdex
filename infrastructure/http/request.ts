import type { z } from "zod";

import { ValidationError } from "@/application/errors";

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON body.");
  }
  return schema.parse(raw);
}

export function parseQuery<T extends z.ZodTypeAny>(
  url: string,
  schema: T
): z.infer<T> {
  const params = Object.fromEntries(new URL(url).searchParams);
  return schema.parse(params);
}
