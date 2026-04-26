import { ForbiddenError } from "@/application/errors";

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function isLocalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getRequestOrigin(request: Request): string | null {
  const host =
    firstHeaderValue(request.headers.get("host")) ??
    firstHeaderValue(request.headers.get("x-forwarded-host"));
  if (!host) {
    return null;
  }

  const forwardedProto = firstHeaderValue(
    request.headers.get("x-forwarded-proto")
  );
  const proto = forwardedProto || (isLocalHost(host) ? "http" : "https");

  return new URL(`${proto}://${host}`).origin;
}

export function assertSameOriginRequest(request: Request): void {
  const originHeader = request.headers.get("origin");
  if (!originHeader) {
    return;
  }

  let origin: string;
  try {
    origin = new URL(originHeader).origin;
  } catch {
    throw new ForbiddenError("Cross-origin mutating requests are not allowed.");
  }

  const requestOrigin = getRequestOrigin(request);
  if (!requestOrigin || origin !== requestOrigin) {
    throw new ForbiddenError("Cross-origin mutating requests are not allowed.");
  }
}
