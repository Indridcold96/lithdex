"use client";

import Link from "next/link";

import type { AnalysisTagDto } from "@/application/dto/AnalysisTagDto";
import type { AnalysisTagSuggestionDto } from "@/application/dto/AnalysisTagSuggestionDto";
import { useAnalysisTags } from "@/presentation/hooks/useAnalysisTags";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { Input } from "@/presentation/ui/input";

interface AnalysisTagsPanelProps {
  analysisId: string;
  isPublic: boolean;
  isOwner: boolean;
  isAuthenticated: boolean;
  initialTags: AnalysisTagDto[];
  initialPendingSuggestions: AnalysisTagSuggestionDto[];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AnalysisTagsPanel({
  analysisId,
  isPublic,
  isOwner,
  isAuthenticated,
  initialTags,
  initialPendingSuggestions,
}: AnalysisTagsPanelProps) {
  const {
    tags,
    pendingSuggestions,
    suggestedTag,
    setSuggestedTag,
    submittingSuggestion,
    reviewingSuggestionId,
    suggestionError,
    setSuggestionError,
    suggestionSuccess,
    reviewError,
    canSuggest,
    submitSuggestion,
    reviewSuggestion,
  } = useAnalysisTags({
    analysisId,
    isPublic,
    isOwner,
    isAuthenticated,
    initialTags,
    initialPendingSuggestions,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>
          Applied tags are visible with the analysis. Community suggestions only
          become public after owner approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Applied tags</h3>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No public tags have been applied yet.
            </p>
          )}
        </section>

        {!isOwner ? (
          <section className="space-y-3 border-t border-border pt-6">
            <h3 className="text-sm font-medium text-foreground">
              Suggest a tag
            </h3>
            {canSuggest ? (
              <form onSubmit={submitSuggestion} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={suggestedTag}
                    onChange={(event) => {
                      setSuggestedTag(event.target.value);
                      if (suggestionError) {
                        setSuggestionError(null);
                      }
                    }}
                    placeholder="e.g. Quartz, Green, Pegmatite"
                    maxLength={80}
                  />
                  <Button
                    type="submit"
                    disabled={submittingSuggestion || suggestedTag.trim().length === 0}
                  >
                    {submittingSuggestion ? "Sending..." : "Suggest tag"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  One suggestion at a time. The analysis owner reviews it before
                  it becomes public.
                </p>
              </form>
            ) : isPublic ? (
              <p className="text-xs text-muted-foreground">
                <Link
                  href={`/login?next=/analyses/${analysisId}`}
                  className="underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to suggest a tag for this analysis.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tag suggestions are only available on public analyses.
              </p>
            )}

            {suggestionSuccess ? (
              <p className="text-xs text-emerald-700" role="status">
                {suggestionSuccess}
              </p>
            ) : null}
            {suggestionError ? (
              <p className="text-xs text-destructive" role="alert">
                {suggestionError}
              </p>
            ) : null}
          </section>
        ) : null}

        {isOwner ? (
          <section className="space-y-3 border-t border-border pt-6">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Pending suggestions
              </h3>
              <p className="text-xs text-muted-foreground">
                Accepting a suggestion applies the tag publicly to this
                analysis. Rejecting it keeps it private.
              </p>
            </div>

            {pendingSuggestions.length > 0 ? (
              <div className="space-y-3">
                {pendingSuggestions.map((suggestion) => {
                  const isReviewing = reviewingSuggestionId === suggestion.id;

                  return (
                    <div
                      key={suggestion.id}
                      className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {suggestion.tag.name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Suggested by{" "}
                          <span className="font-medium text-foreground">
                            {suggestion.suggestedBy?.username ?? "Unknown user"}
                          </span>{" "}
                          on {formatDate(new Date(suggestion.createdAt))}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            reviewSuggestion(suggestion.id, "accept")
                          }
                          disabled={isReviewing}
                        >
                          {isReviewing ? "Saving..." : "Accept"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            reviewSuggestion(suggestion.id, "reject")
                          }
                          disabled={isReviewing}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending tag suggestions right now.
              </p>
            )}

            {reviewError ? (
              <p className="text-xs text-destructive" role="alert">
                {reviewError}
              </p>
            ) : null}
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
