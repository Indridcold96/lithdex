import Link from "next/link";
import { notFound } from "next/navigation";

import type { AnalysisDetailDto } from "@/application/dto/AnalysisDetailDto";
import { NotFoundError } from "@/application/errors";
import { makeGetAnalysisDetail } from "@/application/use-cases/get-analysis-detail";
import { AnalysisVisibility } from "@/domain/enums/AnalysisVisibility";
import { getServerSessionUserId } from "@/infrastructure/auth/session";
import { prisma } from "@/infrastructure/database/prisma";
import { PrismaAnalysisCommentRepository } from "@/infrastructure/database/repositories/PrismaAnalysisCommentRepository";
import { PrismaAnalysisFeedbackRepository } from "@/infrastructure/database/repositories/PrismaAnalysisFeedbackRepository";
import { PrismaAnalysisImageRepository } from "@/infrastructure/database/repositories/PrismaAnalysisImageRepository";
import { PrismaAnalysisInteractionRepository } from "@/infrastructure/database/repositories/PrismaAnalysisInteractionRepository";
import { PrismaAnalysisRepository } from "@/infrastructure/database/repositories/PrismaAnalysisRepository";
import { PrismaAnalysisResultRepository } from "@/infrastructure/database/repositories/PrismaAnalysisResultRepository";
import { PrismaUserRepository } from "@/infrastructure/database/repositories/PrismaUserRepository";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";

import { Button } from "@/presentation/ui/button";

import { AnalysisCommentsBlock } from "./AnalysisCommentsBlock";
import { AnalysisFeedbackActions } from "./AnalysisFeedbackActions";
import { AnalysisGallery } from "./AnalysisGallery";
import { AnalysisPublicInteractions } from "./AnalysisPublicInteractions";
import { AnalysisStatusBadge } from "./AnalysisStatusBadge";
import { AnalysisVisibilityActions } from "./AnalysisVisibilityActions";

interface AnalysisDetailScreenProps {
  id: string;
}

interface DetailContext {
  detail: AnalysisDetailDto;
  viewerUserId: string | null;
}

async function loadDetail(
  id: string,
  viewerUserId: string | null
): Promise<AnalysisDetailDto | null> {
  const getAnalysisDetail = makeGetAnalysisDetail({
    analysisRepository: new PrismaAnalysisRepository(prisma),
    analysisImageRepository: new PrismaAnalysisImageRepository(prisma),
    analysisCommentRepository: new PrismaAnalysisCommentRepository(prisma),
    analysisFeedbackRepository: new PrismaAnalysisFeedbackRepository(prisma),
    analysisResultRepository: new PrismaAnalysisResultRepository(prisma),
    analysisInteractionRepository: new PrismaAnalysisInteractionRepository(
      prisma
    ),
    userRepository: new PrismaUserRepository(prisma),
  });

  try {
    return await getAnalysisDetail({ id, viewerUserId });
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export async function AnalysisDetailScreen({ id }: AnalysisDetailScreenProps) {
  const viewerUserId = await getServerSessionUserId();
  const detail = await loadDetail(id, viewerUserId);
  if (!detail) {
    notFound();
  }

  const ctx: DetailContext = { detail, viewerUserId };
  return <DetailBody {...ctx} />;
}

function DetailBody({ detail, viewerUserId }: DetailContext) {
  const isOwner =
    viewerUserId !== null && detail.userId === viewerUserId;
  const isPublic = detail.visibility === AnalysisVisibility.PUBLIC;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <DetailHeader detail={detail} isOwner={isOwner} />

      <AnalysisGallery images={detail.images} />

      {detail.result ? <ResultBlock detail={detail} /> : null}

      {detail.interactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>How this analysis unfolded</CardTitle>
            <CardDescription>
              A structured summary of the guided identification flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisPublicInteractions interactions={detail.interactions} />
          </CardContent>
        </Card>
      ) : null}

      <FeedbackBlock
        analysisId={detail.id}
        isPublic={isPublic}
        isAuthenticated={viewerUserId !== null}
        initialCounts={detail.feedbackSummary}
        initialViewerFeedback={detail.viewerFeedback}
      />

      <AnalysisCommentsBlock
        analysisId={detail.id}
        isPublic={isPublic}
        isAuthenticated={viewerUserId !== null}
        initialComments={detail.comments}
      />
    </div>
  );
}

function DetailHeader({
  detail,
  isOwner,
}: {
  detail: AnalysisDetailDto;
  isOwner: boolean;
}) {
  const title = detail.title ?? "Untitled analysis";
  const createdLabel = formatDate(new Date(detail.createdAt));
  const ownerNickname = detail.owner?.nickname ?? "Unknown author";

  return (
    <header className="flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <AnalysisStatusBadge status={detail.status} />
        <span>&bull;</span>
        <span>Created {createdLabel}</span>
      </div>

      {isOwner ? (
        <div className="flex flex-col gap-3">
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            nativeButton={false}
            render={<Link href={`/analyses/${detail.id}/session`}>Open analysis session -&gt;</Link>}
          />
          <AnalysisVisibilityActions
            analysisId={detail.id}
            status={detail.status}
            initialVisibility={detail.visibility}
            initialPublishedAt={
              detail.publishedAt ? new Date(detail.publishedAt) : null
            }
            isOwner={isOwner}
          />
        </div>
      ) : null}

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>

      <p className="text-sm text-muted-foreground sm:text-base">
        By{" "}
        {detail.owner ? (
          <Link
            href={`/members/${encodeURIComponent(detail.owner.nickname)}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {ownerNickname}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{ownerNickname}</span>
        )}
      </p>

      <div className="text-sm">
        <Link
          href="/analyses"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          &larr; Back to analyses
        </Link>
      </div>
    </header>
  );
}

function ResultBlock({ detail }: { detail: AnalysisDetailDto }) {
  const result = detail.result;
  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis result</CardTitle>
        <CardDescription>
          {result.sourceType
            ? `Source: ${result.sourceType}`
            : "Identification result"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {typeof result.confidence === "number" ? (
          <p>
            <span className="text-muted-foreground">Confidence:</span>{" "}
            <span className="font-medium">
              {Math.round(result.confidence * 100)}%
            </span>
          </p>
        ) : null}
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

function FeedbackBlock({
  analysisId,
  isPublic,
  isAuthenticated,
  initialCounts,
  initialViewerFeedback,
}: {
  analysisId: string;
  isPublic: boolean;
  isAuthenticated: boolean;
  initialCounts: AnalysisDetailDto["feedbackSummary"];
  initialViewerFeedback: AnalysisDetailDto["viewerFeedback"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community feedback</CardTitle>
        <CardDescription>
          {isPublic
            ? "Confirm or dispute this identification."
            : "Feedback is only available on public analyses."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalysisFeedbackActions
          analysisId={analysisId}
          enabled={isPublic}
          isAuthenticated={isAuthenticated}
          initialCounts={initialCounts}
          initialViewerFeedback={initialViewerFeedback}
        />
      </CardContent>
    </Card>
  );
}
