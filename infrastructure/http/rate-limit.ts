import { RateLimitError } from "@/application/errors";

const DEFAULT_RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";

interface RateLimitOptions {
  bucket: string;
  limit: number;
  windowMs: number;
  identifier?: string | null;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function getClientIp(request: Request): string {
  return firstHeaderValue(request.headers.get("x-forwarded-for")) ?? "unknown";
}

function getRateLimitKey(request: Request, options: RateLimitOptions): string {
  const parts = [options.bucket, getClientIp(request)];
  if (options.identifier) {
    parts.push(options.identifier);
  }
  return parts.join(":");
}

function pruneExpiredAttempts(now: number): void {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

// Best-effort in-memory rate limiting for local/single-instance/basic abuse resistance.
// For Vercel/serverless production, use Vercel Firewall/WAF or a shared store
// such as Redis or Upstash for stronger guarantees.
export function assertRateLimit(
  request: Request,
  options: RateLimitOptions
): void {
  const now = Date.now();
  pruneExpiredAttempts(now);

  const key = getRateLimitKey(request, options);
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (entry.count >= options.limit) {
    throw new RateLimitError(DEFAULT_RATE_LIMIT_MESSAGE);
  }

  entry.count += 1;
}
