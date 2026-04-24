import type { PrismaClient } from "@/generated/prisma/client";

import type { Tag } from "@/domain/entities/Tag";
import type {
  CreateTagData,
  TagRepository,
} from "@/domain/repositories/TagRepository";

type PrismaTagRow = Awaited<ReturnType<PrismaClient["tag"]["findUniqueOrThrow"]>>;

function toDomain(row: PrismaTagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTagRepository implements TagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySlug(slug: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { slug } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateTagData): Promise<Tag> {
    const row = await this.prisma.tag.upsert({
      where: { slug: data.slug },
      create: data,
      update: { name: data.name },
    });

    return toDomain(row);
  }
}
