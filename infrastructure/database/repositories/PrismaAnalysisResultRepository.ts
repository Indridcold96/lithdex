import { Prisma, type PrismaClient } from "@prisma/client";

import type { AnalysisResult } from "@/domain/entities/AnalysisResult";
import type {
  AnalysisResultRepository,
  UpsertAnalysisResultData,
} from "@/domain/repositories/AnalysisResultRepository";

type PrismaAnalysisResultRow = Awaited<
  ReturnType<PrismaClient["analysisResult"]["findUniqueOrThrow"]>
>;

function toDomain(row: PrismaAnalysisResultRow): AnalysisResult {
  return {
    id: row.id,
    analysisId: row.analysisId,
    primaryMineralId: row.primaryMineralId,
    confidence: row.confidence,
    explanation: row.explanation,
    alternativesJson: row.alternativesJson,
    sourceType: row.sourceType,
    rawOutputJson: row.rawOutputJson,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toJsonInput(value: unknown | null): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

export class PrismaAnalysisResultRepository
  implements AnalysisResultRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findByAnalysisId(analysisId: string): Promise<AnalysisResult | null> {
    const row = await this.prisma.analysisResult.findUnique({
      where: { analysisId },
    });
    return row ? toDomain(row) : null;
  }

  async upsertByAnalysisId(
    data: UpsertAnalysisResultData
  ): Promise<AnalysisResult> {
    const alternativesJson = toJsonInput(data.alternativesJson);
    const rawOutputJson = toJsonInput(data.rawOutputJson);

    const row = await this.prisma.analysisResult.upsert({
      where: { analysisId: data.analysisId },
      create: {
        analysisId: data.analysisId,
        primaryMineralId: data.primaryMineralId,
        confidence: data.confidence,
        explanation: data.explanation,
        alternativesJson,
        sourceType: data.sourceType,
        rawOutputJson,
      },
      update: {
        primaryMineralId: data.primaryMineralId,
        confidence: data.confidence,
        explanation: data.explanation,
        alternativesJson: alternativesJson ?? Prisma.JsonNull,
        sourceType: data.sourceType,
        rawOutputJson: rawOutputJson ?? Prisma.JsonNull,
      },
    });
    return toDomain(row);
  }
}
