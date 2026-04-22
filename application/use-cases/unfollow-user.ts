import type { UserFollowRepository } from "@/domain/repositories/UserFollowRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import type { PublicMemberProfileDto } from "../dto/PublicMemberProfileDto";
import { UnauthenticatedError, ValidationError } from "../errors";
import {
  buildPublicMemberProfile,
  resolveUserByUsername,
} from "./member-profile-support";

export interface UnfollowUserInput {
  actorUserId: string | null;
  username: string;
}

export interface UnfollowUserDeps {
  userRepository: UserRepository;
  userFollowRepository: UserFollowRepository;
}

export function makeUnfollowUser(deps: UnfollowUserDeps) {
  return async function unfollowUser(
    input: UnfollowUserInput
  ): Promise<PublicMemberProfileDto> {
    if (!input.actorUserId) {
      throw new UnauthenticatedError("Authentication required.");
    }

    const targetUser = await resolveUserByUsername(
      deps.userRepository,
      input.username
    );

    if (targetUser.id === input.actorUserId) {
      throw new ValidationError("You cannot unfollow yourself.");
    }

    await deps.userFollowRepository.delete(input.actorUserId, targetUser.id);

    return buildPublicMemberProfile({
      followRepository: deps.userFollowRepository,
      user: targetUser,
      viewerUserId: input.actorUserId,
    });
  };
}

export type UnfollowUser = ReturnType<typeof makeUnfollowUser>;
