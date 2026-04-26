import { AnalysisStatus } from "../enums/AnalysisStatus";
import { AnalysisVisibility } from "../enums/AnalysisVisibility";

const MIN_IMAGES_REQUIRED = 3;

export function canSubmitAnalysis(imageCount: number): boolean {
  return imageCount >= MIN_IMAGES_REQUIRED;
}

export function canReceiveCommunityFeedback(
  visibility: AnalysisVisibility | string
): boolean {
  return visibility === AnalysisVisibility.PUBLIC;
}

export function isAnalysisFinalized(
  status: AnalysisStatus | string
): boolean {
  return (
    status === AnalysisStatus.COMPLETED ||
    status === AnalysisStatus.INCONCLUSIVE ||
    status === AnalysisStatus.FAILED
  );
}

export function canRequestFollowUp(
  status: AnalysisStatus | string
): boolean {
  return !isAnalysisFinalized(status);
}

export function canPublishAnalysis(
  status: AnalysisStatus | string
): boolean {
  return (
    status === AnalysisStatus.COMPLETED ||
    status === AnalysisStatus.INCONCLUSIVE
  );
}

export function shouldPublishAnalysis(input: {
  visibility: AnalysisVisibility | string;
  status: AnalysisStatus | string;
  publishedAt: Date | null;
}): boolean {
  return (
    input.visibility === AnalysisVisibility.PUBLIC &&
    canPublishAnalysis(input.status) &&
    input.publishedAt === null
  );
}
