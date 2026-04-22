import type { UserFollowRepository } from "@/domain/repositories/UserFollowRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import type { PublicMemberProfileDto } from "../dto/PublicMemberProfileDto";
import {
  buildPublicMemberProfile,
  resolveUserByNickname,
} from "./member-profile-support";

export interface GetPublicUserProfileByNicknameInput {
  nickname: string;
  viewerUserId: string | null;
}

export interface GetPublicUserProfileByNicknameDeps {
  userRepository: UserRepository;
  userFollowRepository: UserFollowRepository;
}

export function makeGetPublicUserProfileByNickname(
  deps: GetPublicUserProfileByNicknameDeps
) {
  return async function getPublicUserProfileByNickname(
    input: GetPublicUserProfileByNicknameInput
  ): Promise<PublicMemberProfileDto> {
    const user = await resolveUserByNickname(deps.userRepository, input.nickname);

    return buildPublicMemberProfile({
      followRepository: deps.userFollowRepository,
      user,
      viewerUserId: input.viewerUserId,
    });
  };
}

export type GetPublicUserProfileByNickname = ReturnType<
  typeof makeGetPublicUserProfileByNickname
>;
