import type { PrismaClient } from "@prisma/client";

import type { Analysis } from "@/domain/entities/Analysis";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type {
  AnalysisRepository,
  CreateAnalysisShellData,
  ListPublicAnalysesOptions,
  ListPublicAnalysesResult,
  ListUserAnalysesOptions,
} from "@/domain/repositories/AnalysisRepository";

type PrismaAnalysisRow = Awaited<
  ReturnType<PrismaClient["analysis"]["findUniqueOrThrow"]>
>;

function toDomain(row: PrismaAnalysisRow): Analysis {
  return {
    ...row,
    status: row.status as AnalysisStatus,
    visibility: row.visibility as AnalysisVisibility,
  };
}

export class PrismaAnalysisRepository implements AnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createShell(data: CreateAnalysisShellData): Promise<Analysis> {
    const row = await this.prisma.analysis.create({ data });
    return toDomain(row);
  }

  async findById(id: string): Promise<Analysis | null> {
    const row = await this.prisma.analysis.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async listPublic(
    options: ListPublicAnalysesOptions = {}
  ): Promise<ListPublicAnalysesResult> {
    const { limit, cursor } = options;
    const take = typeof limit === "number" ? limit + 1 : undefined;

    const rows = await this.prisma.analysis.findMany({
      where: {
        visibility: AnalysisVisibility.PUBLIC,
        status: AnalysisStatus.COMPLETED,
        publishedAt: { not: null },
      },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
      ...(typeof take === "number" ? { take } : {}),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = typeof limit === "number" ? rows.length > limit : false;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = pageRows.map(toDomain);

    return {
      items,
      nextCursor:
        hasMore && items.length > 0 ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  async listByUserId(
    userId: string,
    options: ListUserAnalysesOptions = {}
  ): Promise<Analysis[]> {
    const { limit, cursor } = options;

    const rows = await this.prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      ...(typeof limit === "number" ? { take: limit } : {}),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return rows.map(toDomain);
  }

  async updateStatus(id: string, status: AnalysisStatus): Promise<Analysis> {
    const row = await this.prisma.analysis.update({
      where: { id },
      data: { status },
    });
    return toDomain(row);
  }

  async setPublishedAt(id: string, publishedAt: Date | null): Promise<Analysis> {
    const row = await this.prisma.analysis.update({
      where: { id },
      data: { publishedAt },
    });
    return toDomain(row);
  }

  async updateVisibility(
    id: string,
    visibility: AnalysisVisibility
  ): Promise<Analysis> {
    const row = await this.prisma.analysis.update({
      where: { id },
      data: { visibility },
    });

    return toDomain(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.analysis.delete({ where: { id } });
  }
}
