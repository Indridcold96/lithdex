import { MAX_USER_BIO_LENGTH } from "@/application/config/profile";
import type { User } from "@/domain/entities/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { UnauthenticatedError, ValidationError } from "../errors";

export interface UpdateCurrentUserProfileInput {
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateCurrentUserProfileDeps {
  userRepository: UserRepository;
}

function normalizeBio(bio: string | null | undefined): string | null | undefined {
  if (bio === undefined) {
    return undefined;
  }
  if (bio === null) {
    return null;
  }

  const trimmed = bio.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > MAX_USER_BIO_LENGTH) {
    throw new ValidationError(
      `Bio must be at most ${MAX_USER_BIO_LENGTH} characters.`
    );
  }

  return trimmed;
}

export function makeUpdateCurrentUserProfile(
  deps: UpdateCurrentUserProfileDeps
) {
  return async function updateCurrentUserProfile(
    input: UpdateCurrentUserProfileInput
  ): Promise<User> {
    const existingUser = await deps.userRepository.findById(input.userId);
    if (!existingUser) {
      throw new UnauthenticatedError("Session is no longer valid.");
    }

    const bio = normalizeBio(input.bio);

    return deps.userRepository.updateProfile(input.userId, {
      ...(bio !== undefined ? { bio } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    });
  };
}

export type UpdateCurrentUserProfile = ReturnType<
  typeof makeUpdateCurrentUserProfile
>;
