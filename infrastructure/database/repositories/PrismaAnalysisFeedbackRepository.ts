import type { PrismaClient } from "@/generated/prisma/client";

import type { AnalysisFeedback } from "@/domain/entities/AnalysisFeedback";
import { AnalysisFeedbackType } from "@/domain/enums/AnalysisFeedbackType";
import type {
  AnalysisFeedbackCounts,
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

  async upsert(data: CreateAnalysisFeedbackData): Promise<AnalysisFeedback> {
    const row = await this.prisma.analysisFeedback.upsert({
      where: {
        analysisId_userId: {
          analysisId: data.analysisId,
          userId: data.userId,
        },
      },
      create: data,
      update: { type: data.type },
    });
    return toDomain(row);
  }

  async countByType(analysisId: string): Promise<AnalysisFeedbackCounts> {
    const groups = await this.prisma.analysisFeedback.groupBy({
      by: ["type"],
      where: { analysisId },
      _count: { _all: true },
    });

    const counts: AnalysisFeedbackCounts = { confirm: 0, dispute: 0 };
    for (const group of groups) {
      if (group.type === AnalysisFeedbackType.CONFIRM) {
        counts.confirm = group._count._all;
      } else if (group.type === AnalysisFeedbackType.DISPUTE) {
        counts.dispute = group._count._all;
      }
    }
    return counts;
  }
}
