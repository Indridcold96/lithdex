import type { PrismaClient } from "@/generated/prisma/client";

import type { AnalysisTag } from "@/domain/entities/AnalysisTag";
import type {
  AnalysisTagRepository,
  AttachAnalysisTagData,
} from "@/domain/repositories/AnalysisTagRepository";

type PrismaAnalysisTagRow = Awaited<
  ReturnType<PrismaClient["analysisTag"]["findFirstOrThrow"]>
>;

type PrismaAnalysisTagWithTagRow = PrismaAnalysisTagRow & {
  tag: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

function toDomain(row: PrismaAnalysisTagWithTagRow): AnalysisTag {
  return {
    analysisId: row.analysisId,
    tagId: row.tagId,
    sourceType: row.sourceType as AnalysisTag["sourceType"],
    createdAt: row.createdAt,
    tag: {
      id: row.tag.id,
      name: row.tag.name,
      slug: row.tag.slug,
      createdAt: row.tag.createdAt,
      updatedAt: row.tag.updatedAt,
    },
  };
}

export class PrismaAnalysisTagRepository implements AnalysisTagRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async attach(data: AttachAnalysisTagData): Promise<AnalysisTag> {
    const existing = await this.prisma.analysisTag.findUnique({
      where: {
        analysisId_tagId: {
          analysisId: data.analysisId,
          tagId: data.tagId,
        },
      },
      include: { tag: true },
    });

    if (existing) {
      return toDomain(existing);
    }

    const row = await this.prisma.analysisTag.create({
      data,
      include: { tag: true },
    });

    return toDomain(row);
  }

  async listByAnalysisId(analysisId: string): Promise<AnalysisTag[]> {
    const rows = await this.prisma.analysisTag.findMany({
      where: { analysisId },
      include: { tag: true },
      orderBy: { createdAt: "asc" },
    });

    return rows.map(toDomain);
  }
}
