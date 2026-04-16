import type { Analysis } from "@/domain/entities/Analysis";
import type {
  AnalysisRepository,
  ListPublicAnalysesOptions,
} from "@/domain/repositories/AnalysisRepository";

export type ListPublicAnalysesInput = ListPublicAnalysesOptions;

export interface ListPublicAnalysesDeps {
  analysisRepository: AnalysisRepository;
}

export function makeListPublicAnalyses(deps: ListPublicAnalysesDeps) {
  return async function listPublicAnalyses(
    input: ListPublicAnalysesInput = {}
  ): Promise<Analysis[]> {
    return deps.analysisRepository.listPublic(input);
  };
}

export type ListPublicAnalyses = ReturnType<typeof makeListPublicAnalyses>;
