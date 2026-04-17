import type { PrismaClient } from "@prisma/client";

import type { AnalysisFeedback } from "@/domain/entities/AnalysisFeedback";
import type { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";
import type {
  AnalysisFeedbackRepository,
  CreateAnalysisFeedbackData,
} from "@/domain/repositories/AnalysisFeedbackRepository";

type PrismaAnalysisFeedbackRow = Awaited<
  ReturnType<PrismaClient["analysisFeedback"]["findUniqueOrThrow"]>
>;

function toDomain(row: PrismaAnalysisFeedbackRow): AnalysisFeedback {
  return {
    ...row,
    type: row.type as AnalysisFeedbackType,
  };
}

export class PrismaAnalysisFeedbackRepository
  implements AnalysisFeedbackRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAnalysisFeedbackData): Promise<AnalysisFeedback> {
    const row = await this.prisma.analysisFeedback.create({ data });
    return toDomain(row);
  }

  async findByAnalysisAndUser(
    analysisId: string,
    userId: string
  ): Promise<AnalysisFeedback | null> {
    const row = await this.prisma.analysisFeedback.findUnique({
      where: { analysisId_userId: { analysisId, userId } },
    });
    return row ? toDomain(row) : null;
  }
}
