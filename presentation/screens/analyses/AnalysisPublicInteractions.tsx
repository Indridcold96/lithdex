import type { AnalysisInteractionDto } from "@/application/dto/AnalysisInteractionDto";
import { AnalysisInteractionType } from "@/domain/enums/AnalysisInteractionType";

interface AnalysisPublicInteractionsProps {
  interactions: AnalysisInteractionDto[];
}

const TYPE_LABEL: Record<string, string> = {
  [AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST]:
    "AI requested more images",
  [AnalysisInteractionType.ASSISTANT_QUESTION]: "AI asked a clarifying question",
  [AnalysisInteractionType.ASSISTANT_PRELIMINARY_ASSESSMENT]:
    "AI preliminary assessment",
  [AnalysisInteractionType.ASSISTANT_FINAL_SUMMARY]: "AI final summary",
  [AnalysisInteractionType.USER_FOLLOWUP_ANSWER]: "User clarification",
};

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// Rendered INSIDE a <Card><CardContent> on the public detail page.
// This is intentionally NOT a chat bubble UI — each step is a structured row
// with a type label so readers understand the flow.
export function AnalysisPublicInteractions({
  interactions,
}: AnalysisPublicInteractionsProps) {
  if (interactions.length === 0) return null;

  return (
    <ol className="flex flex-col gap-3">
      {interactions.map((interaction) => (
        <InteractionRow key={interaction.id} interaction={interaction} />
      ))}
    </ol>
  );
}

function InteractionRow({
  interaction,
}: {
  interaction: AnalysisInteractionDto;
}) {
  const typeLabel = TYPE_LABEL[interaction.interactionType] ?? "Step";
  const createdAt = new Date(interaction.createdAt);

  return (
    <li className="rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-1 flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
          {typeLabel}
        </span>
        <time dateTime={createdAt.toISOString()}>
          {formatTimestamp(createdAt)}
        </time>
      </div>

      <InteractionContent interaction={interaction} />
    </li>
  );
}

function InteractionContent({
  interaction,
}: {
  interaction: AnalysisInteractionDto;
}) {
  const { interactionType, content, metadata } = interaction;

  if (
    interactionType ===
      AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST &&
    metadata &&
    typeof metadata === "object" &&
    "requestedImageTypes" in metadata &&
    Array.isArray((metadata as { requestedImageTypes: unknown }).requestedImageTypes)
  ) {
    const requested = (metadata as { requestedImageTypes: string[] })
      .requestedImageTypes;
    return (
      <div className="space-y-2 text-sm">
        <p>{content}</p>
        <ul className="list-disc pl-5 text-muted-foreground">
          {requested.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (
    interactionType === AnalysisInteractionType.ASSISTANT_QUESTION &&
    metadata &&
    typeof metadata === "object" &&
    "questions" in metadata &&
    Array.isArray((metadata as { questions: unknown }).questions)
  ) {
    const questions = (
      metadata as {
        questions: Array<{ id: string; prompt: string; options?: string[] }>;
      }
    ).questions;
    return (
      <div className="space-y-2 text-sm">
        <p>{content}</p>
        <ul className="space-y-1 pl-2">
          {questions.map((q) => (
            <li key={q.id} className="flex flex-col gap-0.5">
              <span className="font-medium">{q.prompt}</span>
              {q.options && q.options.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Options: {q.options.join(" • ")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (
    interactionType === AnalysisInteractionType.USER_FOLLOWUP_ANSWER &&
    metadata &&
    typeof metadata === "object" &&
    "answers" in metadata &&
    Array.isArray((metadata as { answers: unknown }).answers)
  ) {
    const answers = (
      metadata as {
        answers: Array<{ questionId: string; answer: string }>;
      }
    ).answers;
    return (
      <ul className="space-y-1 text-sm">
        {answers.map((a, i) => (
          <li key={`${a.questionId}-${i}`}>
            <span className="text-muted-foreground">{a.questionId}:</span>{" "}
            <span>{a.answer}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <p className="whitespace-pre-wrap text-sm">{content}</p>;
}
