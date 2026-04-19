// A small, intentional set of statuses for the guided analysis flow.
// Do not introduce new values without updating the use cases that enforce them.
export const AnalysisStatus = {
  PROCESSING: "processing",
  NEEDS_INPUT: "needs_input",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type AnalysisStatus =
  (typeof AnalysisStatus)[keyof typeof AnalysisStatus];

export function isTerminalStatus(status: AnalysisStatus | string): boolean {
  return status === AnalysisStatus.COMPLETED || status === AnalysisStatus.FAILED;
}

export function canStartOrContinue(status: AnalysisStatus | string): boolean {
  return (
    status === AnalysisStatus.NEEDS_INPUT ||
    status === AnalysisStatus.FAILED
  );
}
