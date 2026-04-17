import type { PrismaClient } from "@prisma/client";

import type { AnalysisComment } from "@/domain/entities/AnalysisComment";
import type {
  AnalysisCommentRepository,
  CreateAnalysisCommentData,
} from "@/domain/repositories/AnalysisCommentRepository";

export class PrismaAnalysisCommentRepository
  implements AnalysisCommentRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAnalysisCommentData): Promise<AnalysisComment> {
    return this.prisma.analysisComment.create({ data });
  }

  async listByAnalysisId(analysisId: string): Promise<AnalysisComment[]> {
    return this.prisma.analysisComment.findMany({
      where: { analysisId },
      orderBy: { createdAt: "asc" },
    });
  }
}
