import type { PrismaClient } from "@prisma/client";

import type { Analysis } from "@/domain/entities/Analysis";
import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import type {
  AnalysisRepository,
  CreateAnalysisData,
  ListPublicAnalysesOptions,
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

  async create(data: CreateAnalysisData): Promise<Analysis> {
    const { images, ...rest } = data;

    const row = await this.prisma.analysis.create({
      data: {
        ...rest,
        images: {
          create: images.map((image) => ({
            storageKey: image.storageKey,
            originalFilename: image.originalFilename,
            mimeType: image.mimeType,
            sortOrder: image.sortOrder,
          })),
        },
      },
    });

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
      where: { visibility: AnalysisVisibility.PUBLIC },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      ...(typeof limit === "number" ? { take: limit } : {}),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return rows.map(toDomain);
  }

  async updateVisibility(
    id: string,
    visibility: AnalysisVisibility
  ): Promise<Analysis> {
    const row = await this.prisma.$transaction(async (tx: any) => {
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
}
