export class ApplicationError extends Error {
  override name = "ApplicationError";
}

export class ValidationError extends ApplicationError {
  override name = "ValidationError";
}

export class NotFoundError extends ApplicationError {
  override name = "NotFoundError";
}

export class DuplicateError extends ApplicationError {
  override name = "DuplicateError";
}

export class UnauthenticatedError extends ApplicationError {
  override name = "UnauthenticatedError";
}

export class InvalidCredentialsError extends ApplicationError {
  override name = "InvalidCredentialsError";
}

export class ForbiddenError extends ApplicationError {
  override name = "ForbiddenError";
}

export class ConflictError extends ApplicationError {
  override name = "ConflictError";
}

export class RateLimitError extends ApplicationError {
  override name = "RateLimitError";
}

export class AIProviderError extends ApplicationError {
  override name = "AIProviderError";
}
