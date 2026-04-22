import type { PrismaClient } from "@/generated/prisma/client";

import type { UserFollow } from "@/domain/entities/UserFollow";
import type {
  CreateUserFollowData,
  UserFollowRepository,
} from "@/domain/repositories/UserFollowRepository";

type PrismaUserFollowRow = Awaited<
  ReturnType<PrismaClient["userFollow"]["findUniqueOrThrow"]>
>;

function toDomain(row: PrismaUserFollowRow): UserFollow {
  return {
    followerId: row.followerId,
    followedId: row.followedId,
    createdAt: row.createdAt,
  };
}

export class PrismaUserFollowRepository implements UserFollowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async exists(followerId: string, followedId: string): Promise<boolean> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followedId: {
          followerId,
          followedId,
        },
      },
      select: { followerId: true },
    });

    return follow !== null;
  }

  async create(data: CreateUserFollowData): Promise<UserFollow> {
    const row = await this.prisma.userFollow.create({ data });
    return toDomain(row);
  }

  async delete(followerId: string, followedId: string): Promise<void> {
    await this.prisma.userFollow.deleteMany({
      where: {
        followerId,
        followedId,
      },
    });
  }

  async countFollowers(userId: string): Promise<number> {
    return this.prisma.userFollow.count({
      where: { followedId: userId },
    });
  }

  async countFollowing(userId: string): Promise<number> {
    return this.prisma.userFollow.count({
      where: { followerId: userId },
    });
  }
}
