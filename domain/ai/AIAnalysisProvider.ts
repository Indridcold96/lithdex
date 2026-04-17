// Domain contract for a constrained, synchronous mineral identification AI.
// The provider must behave like a disciplined identification engine — not a
// chatbot. Its response must always be one of the four structured kinds below.

export interface AIAnalysisImageInput {
  mimeType: string;
  base64: string;
}

export interface AIAnalysisPriorInteraction {
  role: "assistant" | "user" | "system";
  interactionType: string;
  content: string;
  metadataJson: unknown | null;
}

export interface AIAnalysisRequestInput {
  analysisId: string;
  title: string | null;
  images: AIAnalysisImageInput[];
  priorInteractions: AIAnalysisPriorInteraction[];
}

export interface AIAnalysisAlternative {
  name: string;
  confidence: number | null;
}

export interface AIAnalysisConstrainedQuestion {
  id: string;
  prompt: string;
  options?: string[];
}

export type AIAnalysisResponse =
  | {
      kind: "final";
      summary: string;
      primaryMineralName: string | null;
      confidence: number | null;
      explanation: string;
      alternatives: AIAnalysisAlternative[];
      rawProviderOutput: unknown;
    }
  | {
      kind: "needs_images";
      summary: string;
      requestedImageTypes: string[];
      rationale: string | null;
      rawProviderOutput: unknown;
    }
  | {
      kind: "needs_clarification";
      summary: string;
      questions: AIAnalysisConstrainedQuestion[];
      rationale: string | null;
      rawProviderOutput: unknown;
    }
  | {
      kind: "inconclusive";
      summary: string;
      reason: string;
      rawProviderOutput: unknown;
    };

export interface AIAnalysisProvider {
  readonly sourceType: string;
  analyze(input: AIAnalysisRequestInput): Promise<AIAnalysisResponse>;
}
