import type { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { AnalysisStatus as Status } from "@/domain/enums/AnalysisStatus";
import { cn } from "@/lib/utils";

interface AnalysisStatusBadgeProps {
  status: AnalysisStatus;
  className?: string;
}

const STATUS_LABEL: Record<AnalysisStatus, string> = {
  [Status.PROCESSING]: "Analyzing",
  [Status.NEEDS_INPUT]: "Needs input",
  [Status.COMPLETED]: "Completed",
  [Status.INCONCLUSIVE]: "Inconclusive",
  [Status.FAILED]: "Failed",
};

const STATUS_CLASSES: Record<AnalysisStatus, string> = {
  [Status.PROCESSING]: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  [Status.NEEDS_INPUT]: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  [Status.COMPLETED]:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  [Status.INCONCLUSIVE]: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  [Status.FAILED]: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function AnalysisStatusBadge({
  status,
  className,
}: AnalysisStatusBadgeProps) {
  const label = STATUS_LABEL[status] ?? status;
  const classes = STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        classes,
        className
      )}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
