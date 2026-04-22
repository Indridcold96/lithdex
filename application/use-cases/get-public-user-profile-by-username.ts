import type { UserFollowRepository } from "@/domain/repositories/UserFollowRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import type { PublicMemberProfileDto } from "../dto/PublicMemberProfileDto";
import {
  buildPublicMemberProfile,
  resolveUserByUsername,
} from "./member-profile-support";

export interface GetPublicUserProfileByUsernameInput {
  username: string;
  viewerUserId: string | null;
}

export interface GetPublicUserProfileByUsernameDeps {
  userRepository: UserRepository;
  userFollowRepository: UserFollowRepository;
}

export function makeGetPublicUserProfileByUsername(
  deps: GetPublicUserProfileByUsernameDeps
) {
  return async function getPublicUserProfileByUsername(
    input: GetPublicUserProfileByUsernameInput
  ): Promise<PublicMemberProfileDto> {
    const user = await resolveUserByUsername(deps.userRepository, input.username);

    return buildPublicMemberProfile({
      followRepository: deps.userFollowRepository,
      user,
      viewerUserId: input.viewerUserId,
    });
  };
}

export type GetPublicUserProfileByUsername = ReturnType<
  typeof makeGetPublicUserProfileByUsername
>;
