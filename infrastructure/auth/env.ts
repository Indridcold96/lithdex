const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET || AUTH_SECRET.length < 32) {
  throw new Error(
    "AUTH_SECRET env var must be set and at least 32 characters long. Generate one with `openssl rand -base64 48` or similar."
  );
}

export const authSecretKey = new TextEncoder().encode(AUTH_SECRET);

export const SESSION_COOKIE_NAME = "lithdex_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
