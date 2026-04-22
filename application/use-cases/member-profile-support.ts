import type { User } from "@/domain/entities/User";
import type { UserFollowRepository } from "@/domain/repositories/UserFollowRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";

import { toUserAvatarUrl } from "../dto/AuthenticatedUserDto";
import type { PublicMemberProfileDto } from "../dto/PublicMemberProfileDto";
import { NotFoundError, ValidationError } from "../errors";
import { normalizeAndValidateUsername } from "../username";

export async function resolveUserByUsername(
  userRepository: UserRepository,
  username: string
): Promise<User> {
  const normalizedUsername = normalizeAndValidateUsername(username);
  const user = await userRepository.findByUsername(normalizedUsername);
  if (!user) {
    throw new NotFoundError(`Member not found: ${normalizedUsername}`);
  }

  return user;
}

export async function resolveUserById(
  userRepository: UserRepository,
  userId: string
): Promise<User> {
  const normalizedUserId = userId.trim();
  if (normalizedUserId.length === 0) {
    throw new ValidationError("User id is required.");
  }

  const user = await userRepository.findById(normalizedUserId);
  if (!user) {
    throw new NotFoundError(`Member not found: ${normalizedUserId}`);
  }

  return user;
}

interface BuildPublicMemberProfileInput {
  followRepository: UserFollowRepository;
  user: User;
  viewerUserId: string | null;
}

export async function buildPublicMemberProfile(
  input: BuildPublicMemberProfileInput
): Promise<PublicMemberProfileDto> {
  const isOwnProfile =
    input.viewerUserId !== null && input.viewerUserId === input.user.id;
  const viewerCanFollow = input.viewerUserId !== null && !isOwnProfile;
  const viewerFollowCheck =
    viewerCanFollow && input.viewerUserId
      ? input.followRepository.exists(input.viewerUserId, input.user.id)
      : Promise.resolve(false);

  const [followerCount, followingCount, viewerIsFollowing] = await Promise.all([
    input.followRepository.countFollowers(input.user.id),
    input.followRepository.countFollowing(input.user.id),
    viewerFollowCheck,
  ]);

  return {
    userId: input.user.id,
    username: input.user.username,
    avatarUrl: toUserAvatarUrl(input.user),
    bio: input.user.bio,
    joinedAt: input.user.createdAt,
    followerCount,
    followingCount,
    viewerCanFollow,
    viewerIsFollowing,
    isOwnProfile,
  };
}
