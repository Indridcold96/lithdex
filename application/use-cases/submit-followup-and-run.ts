import type { AnalysisRunOutcomeDto } from "../dto/AnalysisRunOutcomeDto";
import { ValidationError } from "../errors";
import type {
  FollowupAnswerInput,
  SubmitFollowupAnswers,
} from "./submit-followup-answers";
import type { UploadedFileInput } from "./create-analysis-with-uploads";
import type { RunAnalysisPass } from "./run-analysis-pass";
import type { UploadFollowupImages } from "./upload-followup-images";

export interface SubmitFollowupAndRunInput {
  analysisId: string;
  requesterUserId: string;
  answers: FollowupAnswerInput[];
  files: UploadedFileInput[];
}

export interface SubmitFollowupAndRunDeps {
  submitFollowupAnswers: SubmitFollowupAnswers;
  uploadFollowupImages: UploadFollowupImages;
  runAnalysisPass: RunAnalysisPass;
}

export function makeSubmitFollowupAndRun(deps: SubmitFollowupAndRunDeps) {
  return async function submitFollowupAndRun(
    input: SubmitFollowupAndRunInput
  ): Promise<AnalysisRunOutcomeDto> {
    if (input.answers.length === 0 && input.files.length === 0) {
      throw new ValidationError(
        "Provide at least one follow-up answer or image before continuing the analysis."
      );
    }

    if (input.answers.length > 0) {
      await deps.submitFollowupAnswers({
        analysisId: input.analysisId,
        requesterUserId: input.requesterUserId,
        answers: input.answers,
      });
    }

    if (input.files.length > 0) {
      await deps.uploadFollowupImages({
        analysisId: input.analysisId,
        requesterUserId: input.requesterUserId,
        files: input.files,
      });
    }

    return deps.runAnalysisPass({
      analysisId: input.analysisId,
      requesterUserId: input.requesterUserId,
    });
  };
}

export type SubmitFollowupAndRun = ReturnType<typeof makeSubmitFollowupAndRun>;
