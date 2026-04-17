import type { PrismaClient } from "@prisma/client";

import type { AnalysisResult } from "@/domain/entities/AnalysisResult";
import type { AnalysisResultRepository } from "@/domain/repositories/AnalysisResultRepository";

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
}
