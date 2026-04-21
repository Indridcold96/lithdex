import type { PrismaClient } from "@/generated/prisma/client";

import type { User } from "@/domain/entities/User";
import type {
  CreateUserData,
  UpdateUserProfileData,
  UserRepository,
} from "@/domain/repositories/UserRepository";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { nickname } });
  }

  async listByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    return this.prisma.user.findMany({ where: { id: { in: ids } } });
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
