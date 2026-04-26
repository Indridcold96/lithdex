import type { User } from "@/domain/entities/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import type { FileStorage } from "@/domain/storage/FileStorage";

import {
  MAX_IMAGE_BYTES,
  type AllowedImageMimeType,
} from "../config/uploads";
import { UnauthenticatedError, ValidationError } from "../errors";
import { validateUploadedImage } from "../files/validate-uploaded-image";
import type { UpdateCurrentUserProfile } from "./update-current-user-profile";

export interface UploadUserAvatarFileInput {
  body: Buffer;
  mimeType: string;
  size: number;
}

export interface UploadUserAvatarInput {
  userId: string;
  file: UploadUserAvatarFileInput | null;
}

export interface UploadUserAvatarDeps {
  userRepository: UserRepository;
  fileStorage: FileStorage;
  updateCurrentUserProfile: UpdateCurrentUserProfile;
  buildStorageKey: (args: {
    userId: string;
    mimeType: AllowedImageMimeType;
  }) => string;
}

function requireUser(user: User | null): User {
  if (!user) {
    throw new UnauthenticatedError("Session is no longer valid.");
  }
  return user;
}

async function validateAvatarFile(
  file: UploadUserAvatarFileInput | null
): Promise<{ file: UploadUserAvatarFileInput; mimeType: AllowedImageMimeType }> {
  if (!file) {
    throw new ValidationError("No avatar file was provided.");
  }
  if (!file.size || file.body.length === 0) {
    throw new ValidationError("Avatar file is empty.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      `Avatar exceeds the ${MAX_IMAGE_BYTES}-byte limit.`
    );
  }
  return {
    file,
    mimeType: await validateUploadedImage(file, "Avatar"),
  };
}

export function makeUploadUserAvatar(deps: UploadUserAvatarDeps) {
  return async function uploadUserAvatar(
    input: UploadUserAvatarInput
  ): Promise<User> {
    const currentUser = requireUser(
      await deps.userRepository.findById(input.userId)
    );
    const { file, mimeType } = await validateAvatarFile(input.file);

    const storageKey = deps.buildStorageKey({
      userId: input.userId,
      mimeType,
    });

    await deps.fileStorage.upload({
      key: storageKey,
      body: file.body,
      contentType: mimeType,
    });

    try {
      const updatedUser = await deps.updateCurrentUserProfile({
        userId: input.userId,
        avatarUrl: storageKey,
      });

      if (currentUser.avatarUrl && currentUser.avatarUrl !== storageKey) {
        void deps.fileStorage.delete(currentUser.avatarUrl).catch(() => {
          // Best-effort cleanup of the previous avatar object.
        });
      }

      return updatedUser;
    } catch (error) {
      await deps.fileStorage.delete(storageKey).catch(() => {
        // Best-effort cleanup of the newly uploaded avatar if persistence fails.
      });
      throw error;
    }
  };
}

export type UploadUserAvatar = ReturnType<typeof makeUploadUserAvatar>;
