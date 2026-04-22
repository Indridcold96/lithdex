import { ValidationError } from "./errors";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]{1,22}[a-z0-9])?$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(username: string): void {
  if (username.length === 0) {
    throw new ValidationError("Username is required.");
  }

  if (username.length < USERNAME_MIN_LENGTH) {
    throw new ValidationError(
      `Username must be at least ${USERNAME_MIN_LENGTH} characters long.`
    );
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    throw new ValidationError(
      `Username must be at most ${USERNAME_MAX_LENGTH} characters long.`
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new ValidationError(
      "Username may only contain lowercase letters, numbers, or underscores, and cannot start or end with an underscore."
    );
  }
}

export function normalizeAndValidateUsername(input: string): string {
  const username = normalizeUsername(input);
  validateUsername(username);
  return username;
}
