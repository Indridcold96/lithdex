"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type SubmitEvent } from "react";
import { Loader2, Play, RefreshCw } from "lucide-react";

import type { AnalysisImageDto } from "@/application/dto/AnalysisDto";
import type { AnalysisInteractionDto } from "@/application/dto/AnalysisInteractionDto";
import type { AnalysisResultDto } from "@/application/dto/AnalysisResultDto";
import type { AnalysisSessionDto } from "@/application/dto/AnalysisSessionDto";
import { AnalysisInteractionType } from "@/domain/enums/AnalysisInteractionType";
import { AnalysisStatus } from "@/domain/enums/AnalysisStatus";
import { useAnalysisSessionFlow } from "@/presentation/hooks/useAnalysisSessionFlow";
import { Alert, AlertDescription } from "@/presentation/ui/alert";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { Label } from "@/presentation/ui/label";
import { Textarea } from "@/presentation/ui/textarea";

import { AnalysisStatusBadge } from "./AnalysisStatusBadge";

interface AnalysisSessionClientProps {
  initialSession: AnalysisSessionDto;
}

interface ConstrainedQuestion {
  id: string;
  prompt: string;
  options?: string[];
}

interface UploadResponseBody {
  images: AnalysisImageDto[];
}

function extractQuestionsFromInteraction(
  interaction: AnalysisInteractionDto | null
): ConstrainedQuestion[] {
  if (!interaction) return [];
  const meta = interaction.metadata;
  if (
    meta &&
    typeof meta === "object" &&
    "questions" in meta &&
    Array.isArray((meta as { questions: unknown }).questions)
  ) {
    const raw = (meta as { questions: ConstrainedQuestion[] }).questions;
    return raw.filter((q) => q && typeof q.id === "string" && q.prompt);
  }
  return [];
}

function extractRequestedImageTypes(
  interaction: AnalysisInteractionDto | null
): string[] {
  if (!interaction) return [];
  const meta = interaction.metadata;
  if (
    meta &&
    typeof meta === "object" &&
    "requestedImageTypes" in meta &&
    Array.isArray((meta as { requestedImageTypes: unknown }).requestedImageTypes)
  ) {
    return (
      meta as { requestedImageTypes: string[] }
    ).requestedImageTypes.filter((s) => typeof s === "string" && s.length > 0);
  }
  return [];
}

function findLatestInteractionOfType(
  interactions: AnalysisInteractionDto[],
  type: string
): AnalysisInteractionDto | null {
  for (let i = interactions.length - 1; i >= 0; i--) {
    if (interactions[i].interactionType === type) {
      return interactions[i];
    }
  }
  return null;
}

export function AnalysisSessionClient({
  initialSession,
}: AnalysisSessionClientProps) {
  const { session, running, error, run, refetchSession } =
    useAnalysisSessionFlow(initialSession);

  const { images, interactions, status, result } = session;

  const latestQuestionInteraction = useMemo(
    () =>
      findLatestInteractionOfType(
        interactions,
        AnalysisInteractionType.ASSISTANT_QUESTION
      ),
    [interactions]
  );
  const latestFollowupRequest = useMemo(
    () =>
      findLatestInteractionOfType(
        interactions,
        AnalysisInteractionType.ASSISTANT_FOLLOWUP_REQUEST
      ),
    [interactions]
  );

  const pendingQuestions =
    status === AnalysisStatus.NEEDS_INPUT
      ? extractQuestionsFromInteraction(latestQuestionInteraction)
      : [];
  const pendingImageRequests =
    status === AnalysisStatus.NEEDS_INPUT
      ? extractRequestedImageTypes(latestFollowupRequest)
      : [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <SessionHeader session={session} />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <ImagesCard
        images={images}
        analysisId={session.id}
        canUpload={status === AnalysisStatus.NEEDS_INPUT}
        pendingImageRequests={pendingImageRequests}
        onUploaded={async () => {
          await refetchSession();
        }}
      />

      {status === AnalysisStatus.PROCESSING ? <ProcessingCard /> : null}

      {status === AnalysisStatus.NEEDS_INPUT && pendingQuestions.length > 0 ? (
        <QuestionsCard
          analysisId={session.id}
          questions={pendingQuestions}
          onAnswered={async () => {
            await refetchSession();
          }}
        />
      ) : null}

      {status === AnalysisStatus.COMPLETED && result ? (
        <ResultCard result={result} />
      ) : null}

      {status === AnalysisStatus.FAILED ? <FailedCard session={session} /> : null}

      <RunBlock
        status={status}
        running={running}
        onRun={run}
      />

      <HistorySection interactions={interactions} />
    </div>
  );
}

function SessionHeader({ session }: { session: AnalysisSessionDto }) {
  return (
    <header className="flex flex-col gap-2 border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <AnalysisStatusBadge status={session.status} />
        <span>•</span>
        <Link
          href={`/analyses/${session.id}`}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          View public detail
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {session.title ?? "Untitled analysis"}
      </h1>
      <p className="text-sm text-muted-foreground">
        Guided synchronous analysis session.
      </p>
    </header>
  );
}

function ProcessingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          AI is analyzing your images
        </CardTitle>
        <CardDescription>
          This usually takes a few seconds. Keep this tab open.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function ResultCard({ result }: { result: AnalysisResultDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Final result</CardTitle>
        <CardDescription>
          Source: {result.sourceType}
          {typeof result.confidence === "number"
            ? ` • Confidence ${Math.round(result.confidence * 100)}%`
            : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {result.explanation ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            {result.explanation}
          </p>
        ) : (
          <p className="text-muted-foreground">No explanation provided.</p>
        )}
      </CardContent>
    </Card>
  );
}

function FailedCard({ session }: { session: AnalysisSessionDto }) {
  const latestFinal = findLatestInteractionOfType(
    session.interactions,
    AnalysisInteractionType.ASSISTANT_FINAL_SUMMARY
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inconclusive</CardTitle>
        <CardDescription>
          The AI could not reach a confident identification.
        </CardDescription>
      </CardHeader>
      {latestFinal ? (
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {latestFinal.content}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function RunBlock({
  status,
  running,
  onRun,
}: {
  status: AnalysisStatus;
  running: boolean;
  onRun: () => void;
}) {
  if (status !== AnalysisStatus.NEEDS_INPUT && status !== AnalysisStatus.FAILED) {
    return null;
  }

  const label =
    status === AnalysisStatus.NEEDS_INPUT
      ? "Continue analysis"
      : "Retry analysis";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {status === AnalysisStatus.NEEDS_INPUT
            ? "Once you've addressed the follow-up, continue the analysis."
            : "You can retry the analysis."}
        </p>
        <p className="text-xs text-muted-foreground">
          Analysis runs synchronously and will return one of: final result,
          needs images, needs clarification, or inconclusive.
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={running}
        onClick={onRun}
        className="gap-2"
      >
        {running ? (
          <Loader2 aria-hidden className="size-4 animate-spin" />
        ) : status === AnalysisStatus.FAILED ? (
          <RefreshCw aria-hidden className="size-4" />
        ) : (
          <Play aria-hidden className="size-4" />
        )}
        {label}
      </Button>
    </div>
  );
}

function ImagesCard({
  images,
  analysisId,
  canUpload,
  pendingImageRequests,
  onUploaded,
}: {
  images: AnalysisImageDto[];
  analysisId: string;
  canUpload: boolean;
  pendingImageRequests: string[];
  onUploaded: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    setSelectedFiles(files ? Array.from(files) : []);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedFiles.length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      const res = await fetch(
        `/api/analyses/${analysisId}/followup/images`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Upload failed.");
      }
      const data = (await res.json()) as UploadResponseBody;
      void data;
      setSelectedFiles([]);
      // Force the native file input to reset by remounting it.
      setInputKey((k) => k + 1);
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specimen images</CardTitle>
        <CardDescription>
          {images.length} image{images.length === 1 ? "" : "s"} attached.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="aspect-square overflow-hidden rounded-md border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.originalFilename ?? `Image ${image.sortOrder + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}

        {canUpload && pendingImageRequests.length > 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm">
            <p className="font-medium">The AI requested more images:</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {pendingImageRequests.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {canUpload ? (
          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <Label htmlFor="followup-files" className="text-sm">
              Upload additional images
            </Label>
            <input
              key={inputKey}
              id="followup-files"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={submitting}
              onChange={handleFileChange}
              className="text-sm"
            />
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || selectedFiles.length === 0}
              >
                {submitting
                  ? "Uploading..."
                  : `Attach ${selectedFiles.length || ""} image${selectedFiles.length === 1 ? "" : "s"}`.trim()}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function QuestionsCard({
  analysisId,
  questions,
  onAnswered,
}: {
  analysisId: string;
  questions: ConstrainedQuestion[];
  onAnswered: () => void | Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = questions
      .map((q) => ({
        questionId: q.id,
        answer: (answers[q.id] ?? "").trim(),
      }))
      .filter((a) => a.answer.length > 0);
    if (payload.length === 0) {
      setError("Please answer at least one question.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/analyses/${analysisId}/followup/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payload }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not submit answers.");
      }
      setAnswers({});
      await onAnswered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>The AI asked for clarification</CardTitle>
        <CardDescription>
          Answer the constrained questions below to help narrow the
          identification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id] ?? ""}
              onChange={(value) => setAnswer(q.id, value)}
              disabled={submitting}
            />
          ))}

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit answers"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: ConstrainedQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const inputId = `question-${question.id}`;

  if (question.options && question.options.length > 0) {
    return (
      <fieldset className="flex flex-col gap-2" disabled={disabled}>
        <legend className="text-sm font-medium">{question.prompt}</legend>
        <div className="flex flex-col gap-1">
          {question.options.map((option) => {
            const optionId = `${inputId}-${option}`;
            return (
              <label
                key={option}
                htmlFor={optionId}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  id={optionId}
                  type="radio"
                  name={inputId}
                  value={option}
                  checked={value === option}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onChange(e.target.value)
                  }
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={inputId} className="text-sm">
        {question.prompt}
      </Label>
      <Textarea
        id={inputId}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function HistorySection({
  interactions,
}: {
  interactions: AnalysisInteractionDto[];
}) {
  if (interactions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis history</CardTitle>
        <CardDescription>
          Every recorded step of this guided session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2">
          {interactions.map((interaction) => (
            <HistoryRow key={interaction.id} interaction={interaction} />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function HistoryRow({ interaction }: { interaction: AnalysisInteractionDto }) {
  const createdAt = new Date(interaction.createdAt);
  return (
    <li className="flex flex-col gap-1 rounded-md border border-border bg-background/50 p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
          {interaction.role}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
          {interaction.interactionType}
        </span>
        <time dateTime={createdAt.toISOString()}>
          {createdAt.toLocaleString()}
        </time>
      </div>
      <p className="whitespace-pre-wrap">{interaction.content}</p>
    </li>
  );
}
