import type { PrismaClient } from "@/generated/prisma/client";

import type { AnalysisTagSuggestion } from "@/domain/entities/AnalysisTagSuggestion";
import { AnalysisTagSuggestionStatus } from "@/domain/enums/AnalysisTagSuggestionStatus";
import type {
  AnalysisTagSuggestionRepository,
  CreateAnalysisTagSuggestionData,
  ReviewAnalysisTagSuggestionData,
} from "@/domain/repositories/AnalysisTagSuggestionRepository";

type PrismaAnalysisTagSuggestionRow = Awaited<
  ReturnType<PrismaClient["analysisTagSuggestion"]["findFirstOrThrow"]>
>;

type PrismaAnalysisTagSuggestionWithTagRow = PrismaAnalysisTagSuggestionRow & {
  tag: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

function toDomain(
  row: PrismaAnalysisTagSuggestionWithTagRow
): AnalysisTagSuggestion {
  return {
    id: row.id,
    analysisId: row.analysisId,
    tagId: row.tagId,
    suggestedByUserId: row.suggestedByUserId,
    status: row.status as AnalysisTagSuggestion["status"],
    reviewedByUserId: row.reviewedByUserId,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tag: {
      id: row.tag.id,
      name: row.tag.name,
      slug: row.tag.slug,
      createdAt: row.tag.createdAt,
      updatedAt: row.tag.updatedAt,
    },
  };
}

export class PrismaAnalysisTagSuggestionRepository
  implements AnalysisTagSuggestionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreateAnalysisTagSuggestionData
  ): Promise<AnalysisTagSuggestion> {
    const row = await this.prisma.analysisTagSuggestion.create({
      data,
      include: { tag: true },
    });

    return toDomain(row);
  }

  async findById(id: string): Promise<AnalysisTagSuggestion | null> {
    const row = await this.prisma.analysisTagSuggestion.findUnique({
      where: { id },
      include: { tag: true },
    });

    return row ? toDomain(row) : null;
  }

  async findPendingByAnalysisAndTag(
    analysisId: string,
    tagId: string
  ): Promise<AnalysisTagSuggestion | null> {
    const row = await this.prisma.analysisTagSuggestion.findFirst({
      where: {
        analysisId,
        tagId,
        status: AnalysisTagSuggestionStatus.PENDING,
      },
      include: { tag: true },
      orderBy: { createdAt: "desc" },
    });

    return row ? toDomain(row) : null;
  }

  async findLatestByAnalysisAndTag(
    analysisId: string,
    tagId: string
  ): Promise<AnalysisTagSuggestion | null> {
    const row = await this.prisma.analysisTagSuggestion.findFirst({
      where: { analysisId, tagId },
      include: { tag: true },
      orderBy: { createdAt: "desc" },
    });

    return row ? toDomain(row) : null;
  }

  async listPendingByAnalysisId(
    analysisId: string
  ): Promise<AnalysisTagSuggestion[]> {
    const rows = await this.prisma.analysisTagSuggestion.findMany({
      where: {
        analysisId,
        status: AnalysisTagSuggestionStatus.PENDING,
      },
      include: { tag: true },
      orderBy: { createdAt: "asc" },
    });

    return rows.map(toDomain);
  }

  async review(
    data: ReviewAnalysisTagSuggestionData
  ): Promise<AnalysisTagSuggestion> {
    const row = await this.prisma.analysisTagSuggestion.update({
      where: { id: data.id },
      data: {
        status: data.status,
        reviewedByUserId: data.reviewedByUserId,
        reviewedAt: data.reviewedAt,
      },
      include: { tag: true },
    });

    return toDomain(row);
  }
}
