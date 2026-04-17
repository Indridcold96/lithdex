import type { PrismaClient, Prisma } from "@prisma/client";

import type { AnalysisInteraction } from "@/domain/entities/AnalysisInteraction";
import type { AnalysisInteractionRole } from "@/domain/enums/AnalysisInteractionRole";
import type { AnalysisInteractionType } from "@/domain/enums/AnalysisInteractionType";
import type {
  AnalysisInteractionRepository,
  CreateAnalysisInteractionData,
} from "@/domain/repositories/AnalysisInteractionRepository";

type PrismaAnalysisInteractionRow = Awaited<
  ReturnType<PrismaClient["analysisInteraction"]["findUniqueOrThrow"]>
>;

function toDomain(row: PrismaAnalysisInteractionRow): AnalysisInteraction {
  return {
    id: row.id,
    analysisId: row.analysisId,
    role: row.role as AnalysisInteractionRole,
    interactionType: row.interactionType as AnalysisInteractionType,
    content: row.content,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt,
  };
}

function toJsonInput(value: unknown | null): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

export class PrismaAnalysisInteractionRepository
  implements AnalysisInteractionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: CreateAnalysisInteractionData
  ): Promise<AnalysisInteraction> {
    const row = await this.prisma.analysisInteraction.create({
      data: {
        analysisId: data.analysisId,
        role: data.role,
        interactionType: data.interactionType,
        content: data.content,
        metadataJson: toJsonInput(data.metadataJson),
      },
    });
    return toDomain(row);
  }

  async listByAnalysisId(analysisId: string): Promise<AnalysisInteraction[]> {
    const rows = await this.prisma.analysisInteraction.findMany({
      where: { analysisId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDomain);
  }

  async findLatestByType(
    analysisId: string,
    interactionType: AnalysisInteractionType
  ): Promise<AnalysisInteraction | null> {
    const row = await this.prisma.analysisInteraction.findFirst({
      where: { analysisId, interactionType },
      orderBy: { createdAt: "desc" },
    });
    return row ? toDomain(row) : null;
  }
}
