import type { PrismaClient } from "@prisma/client";

import type { Analysis } from "@/domain/entities/Analysis";
import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type {
  AnalysisRepository,
  CreateAnalysisShellData,
  ListPublicAnalysesOptions,
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
  ): Promise<Analysis[]> {
    const { limit, cursor } = options;

    const rows = await this.prisma.analysis.findMany({
      where: {
        visibility: AnalysisVisibility.PUBLIC,
        publishedAt: { not: null },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      ...(typeof limit === "number" ? { take: limit } : {}),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return rows.map(toDomain);
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

  async updateVisibility(
    id: string,
    visibility: AnalysisVisibility
  ): Promise<Analysis> {
    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.analysis.findUniqueOrThrow({ where: { id } });

      const shouldPublishNow =
        visibility === AnalysisVisibility.PUBLIC &&
        existing.publishedAt === null;

      return tx.analysis.update({
        where: { id },
        data: {
          visibility,
          ...(shouldPublishNow ? { publishedAt: new Date() } : {}),
        },
      });
    });

    return toDomain(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.analysis.delete({ where: { id } });
  }
}
