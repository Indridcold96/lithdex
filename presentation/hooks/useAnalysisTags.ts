"use client";

import { useState, type FormEvent } from "react";

import type { AnalysisTagDto } from "@/application/dto/AnalysisTagDto";
import type { AnalysisTagSuggestionDto } from "@/application/dto/AnalysisTagSuggestionDto";

interface UseAnalysisTagsInput {
  analysisId: string;
  isPublic: boolean;
  isOwner: boolean;
  isAuthenticated: boolean;
  initialTags: AnalysisTagDto[];
  initialPendingSuggestions: AnalysisTagSuggestionDto[];
}

interface ReviewSuggestionResponseBody {
  suggestionId: string;
  appliedTag?: AnalysisTagDto;
}

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  return body?.error ?? fallback;
}

function addAppliedTag(
  existing: AnalysisTagDto[],
  nextTag: AnalysisTagDto
): AnalysisTagDto[] {
  if (existing.some((tag) => tag.slug === nextTag.slug)) {
    return existing;
  }

  return [...existing, nextTag];
}

export function useAnalysisTags({
  analysisId,
  isPublic,
  isOwner,
  isAuthenticated,
  initialTags,
  initialPendingSuggestions,
}: UseAnalysisTagsInput) {
  const [tags, setTags] = useState(initialTags);
  const [pendingSuggestions, setPendingSuggestions] = useState(
    initialPendingSuggestions
  );
  const [suggestedTag, setSuggestedTag] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [reviewingSuggestionId, setReviewingSuggestionId] = useState<
    string | null
  >(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionSuccess, setSuggestionSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const canSuggest = isPublic && isAuthenticated && !isOwner;

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSuggest || submittingSuggestion) {
      return;
    }

    const trimmed = suggestedTag.trim();
    if (trimmed.length === 0) {
      return;
    }

    setSubmittingSuggestion(true);
    setSuggestionError(null);
    setSuggestionSuccess(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/tag-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: trimmed }),
      });

      if (!res.ok) {
        throw new Error(
          await readErrorMessage(res, "Could not submit tag suggestion.")
        );
      }

      await res.json().catch(() => null);
      setSuggestedTag("");
      setSuggestionSuccess("Suggestion sent for review.");
    } catch (error) {
      setSuggestionError(
        error instanceof Error ? error.message : "Unexpected error."
      );
    } finally {
      setSubmittingSuggestion(false);
    }
  }

  async function reviewSuggestion(
    suggestionId: string,
    action: "accept" | "reject"
  ) {
    if (!isOwner || reviewingSuggestionId) {
      return;
    }

    setReviewingSuggestionId(suggestionId);
    setReviewError(null);
    try {
      const res = await fetch(
        `/api/analyses/${analysisId}/tag-suggestions/${suggestionId}/${action}`,
        { method: "POST" }
      );

      if (!res.ok) {
        throw new Error(
          await readErrorMessage(
            res,
            `Could not ${action} this tag suggestion.`
          )
        );
      }

      const data = (await res.json()) as ReviewSuggestionResponseBody;
      setPendingSuggestions((current) =>
        current.filter((suggestion) => suggestion.id !== data.suggestionId)
      );

      const appliedTag = data.appliedTag;
      if (action === "accept" && appliedTag) {
        setTags((current) => addAppliedTag(current, appliedTag));
      }
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Unexpected error."
      );
    } finally {
      setReviewingSuggestionId(null);
    }
  }

  return {
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
  };
}
