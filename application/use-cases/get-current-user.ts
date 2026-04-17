import type { User } from "@/domain/entities/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { UnauthenticatedError } from "../errors";

export interface GetCurrentUserDeps {
  userRepository: UserRepository;
}

export function makeGetCurrentUser(deps: GetCurrentUserDeps) {
  return async function getCurrentUser(userId: string): Promise<User> {
    const user = await deps.userRepository.findById(userId);
    if (!user) {
      throw new UnauthenticatedError("Session is no longer valid.");
    }
    return user;
  };
}

export type GetCurrentUser = ReturnType<typeof makeGetCurrentUser>;
