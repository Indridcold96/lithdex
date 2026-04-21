import type { User } from "@/domain/entities/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { NotFoundError } from "../errors";

export interface AccessUserAvatarInput {
  userId: string;
}

export interface AccessUserAvatarDeps {
  userRepository: UserRepository;
}

function requireAvatarOwner(user: User | null, userId: string): User {
  if (!user) {
    throw new NotFoundError(`User not found: ${userId}`);
  }
  if (!user.avatarUrl) {
    throw new NotFoundError(`User avatar not found: ${userId}`);
  }
  return user;
}

export function makeAccessUserAvatar(deps: AccessUserAvatarDeps) {
  return async function accessUserAvatar(
    input: AccessUserAvatarInput
  ): Promise<User> {
    const user = await deps.userRepository.findById(input.userId);
    return requireAvatarOwner(user, input.userId);
  };
}

export type AccessUserAvatar = ReturnType<typeof makeAccessUserAvatar>;
