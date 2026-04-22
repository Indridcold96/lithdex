"use client";

import { useState } from "react";

import type { PublicMemberProfileDto } from "@/application/dto/PublicMemberProfileDto";

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  return body?.error ?? fallback;
}

interface UseMemberProfileFollowInput {
  initialProfile: PublicMemberProfileDto;
}

export function useMemberProfileFollow({
  initialProfile,
}: UseMemberProfileFollowInput) {
  const [profile, setProfile] = useState(initialProfile);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow() {
    if (!profile.viewerCanFollow || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/members/${encodeURIComponent(profile.username)}/follow`,
        {
          method: profile.viewerIsFollowing ? "DELETE" : "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            profile.viewerIsFollowing
              ? "Could not unfollow this member."
              : "Could not follow this member."
          )
        );
      }

      const nextProfile = (await response.json()) as PublicMemberProfileDto;
      setProfile(nextProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    profile,
    submitting,
    error,
    toggleFollow,
  };
}
