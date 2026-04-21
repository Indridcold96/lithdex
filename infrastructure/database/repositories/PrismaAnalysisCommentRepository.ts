import type { PrismaClient } from "@/generated/prisma/client";

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

  async findById(id: string): Promise<AnalysisComment | null> {
    return this.prisma.analysisComment.findUnique({
      where: { id },
    });
  }

  async listByAnalysisId(analysisId: string): Promise<AnalysisComment[]> {
    return this.prisma.analysisComment.findMany({
      where: { analysisId },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateContent(id: string, content: string): Promise<AnalysisComment> {
    return this.prisma.analysisComment.update({
      where: { id },
      data: { content },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.analysisComment.delete({
      where: { id },
    });
  }
}
