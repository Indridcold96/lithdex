import type { User } from "@/domain/entities/User";

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserDto {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
}

export function toUserAvatarUrl(user: User): string | null {
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
    username: user.username,
    avatarUrl: toUserAvatarUrl(user),
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicUserDto(user: User): PublicUserDto {
  return {
    username: user.username,
    avatarUrl: toUserAvatarUrl(user),
    bio: user.bio,
    createdAt: user.createdAt,
  };
}
