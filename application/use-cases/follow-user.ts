import type { UserFollowRepository } from "@/domain/repositories/UserFollowRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import type { PublicMemberProfileDto } from "../dto/PublicMemberProfileDto";
import { UnauthenticatedError, ValidationError } from "../errors";
import {
  buildPublicMemberProfile,
  resolveUserByUsername,
} from "./member-profile-support";

export interface FollowUserInput {
  actorUserId: string | null;
  username: string;
}

export interface FollowUserDeps {
  userRepository: UserRepository;
  userFollowRepository: UserFollowRepository;
}

export function makeFollowUser(deps: FollowUserDeps) {
  return async function followUser(
    input: FollowUserInput
  ): Promise<PublicMemberProfileDto> {
    if (!input.actorUserId) {
      throw new UnauthenticatedError("Authentication required.");
    }

    const targetUser = await resolveUserByUsername(
      deps.userRepository,
      input.username
    );

    if (targetUser.id === input.actorUserId) {
      throw new ValidationError("You cannot follow yourself.");
    }

    const alreadyFollowing = await deps.userFollowRepository.exists(
      input.actorUserId,
      targetUser.id
    );

    if (!alreadyFollowing) {
      await deps.userFollowRepository.create({
        followerId: input.actorUserId,
        followedId: targetUser.id,
      });
    }

    return buildPublicMemberProfile({
      followRepository: deps.userFollowRepository,
      user: targetUser,
      viewerUserId: input.actorUserId,
    });
  };
}

export type FollowUser = ReturnType<typeof makeFollowUser>;
