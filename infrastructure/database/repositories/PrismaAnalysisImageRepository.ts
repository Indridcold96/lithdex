import type { PrismaClient } from "@prisma/client";

import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import type {
  AnalysisImageRepository,
  CreateAnalysisImageData,
} from "@/domain/repositories/AnalysisImageRepository";

export class PrismaAnalysisImageRepository implements AnalysisImageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateAnalysisImageData): Promise<AnalysisImage> {
    return this.prisma.analysisImage.create({ data });
  }

  async findById(id: string): Promise<AnalysisImage | null> {
    return this.prisma.analysisImage.findUnique({ where: { id } });
  }

  async listByAnalysisId(analysisId: string): Promise<AnalysisImage[]> {
    return this.prisma.analysisImage.findMany({
      where: { analysisId },
      orderBy: { sortOrder: "asc" },
    });
  }
}
