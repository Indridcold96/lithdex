import type { UserFollow } from "../entities/UserFollow";

export interface CreateUserFollowData {
  followerId: string;
  followedId: string;
}

export interface UserFollowRepository {
  exists(followerId: string, followedId: string): Promise<boolean>;
  create(data: CreateUserFollowData): Promise<UserFollow>;
  delete(followerId: string, followedId: string): Promise<void>;
  countFollowers(userId: string): Promise<number>;
  countFollowing(userId: string): Promise<number>;
}
