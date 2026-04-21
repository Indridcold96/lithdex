import type { User } from "@/domain/entities/User";

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserDto {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
}

function toUserAvatarUrl(user: User): string | null {
  if (!user.avatarUrl) {
    return null;
  }

  const version = user.updatedAt.getTime();
  return `/api/users/${encodeURIComponent(user.id)}/avatar?v=${version}`;
}

export function toAuthenticatedUserDto(user: User): AuthenticatedUserDto {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: toUserAvatarUrl(user),
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicUserDto(user: User): PublicUserDto {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: toUserAvatarUrl(user),
    bio: user.bio,
    createdAt: user.createdAt,
  };
}
