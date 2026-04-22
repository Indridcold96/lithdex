"use client";

import Link from "next/link";

import type { PublicMemberProfileDto } from "@/application/dto/PublicMemberProfileDto";
import { useMemberProfileFollow } from "@/presentation/hooks/useMemberProfileFollow";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";

interface MemberProfileClientProps {
  initialProfile: PublicMemberProfileDto;
}

function formatJoinDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCount(count: number, label: string): string {
  return `${new Intl.NumberFormat("en-US").format(count)} ${label}`;
}

function Avatar({ profile }: { profile: PublicMemberProfileDto }) {
  if (profile.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatarUrl}
        alt={`${profile.username} avatar`}
        className="size-24 rounded-2xl object-cover ring-1 ring-border sm:size-28"
      />
    );
  }

  return (
    <div className="flex size-24 items-center justify-center rounded-2xl bg-muted text-3xl font-semibold text-foreground ring-1 ring-border sm:size-28">
      {profile.username.slice(0, 1).toUpperCase()}
    </div>
  );
}

function FollowAction({
  profile,
  submitting,
  onToggle,
}: {
  profile: PublicMemberProfileDto;
  submitting: boolean;
  onToggle: () => void;
}) {
  if (profile.isOwnProfile) {
    return null;
  }

  if (!profile.viewerCanFollow) {
    return (
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button type="button" size="sm" disabled>
          Follow
        </Button>
        <Link
          href={`/login?next=/members/${encodeURIComponent(profile.username)}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Sign in to follow this member
        </Link>
      </div>
    );
  }

  return (
    <Button type="button" size="sm" onClick={onToggle} disabled={submitting}>
      {submitting
        ? profile.viewerIsFollowing
          ? "Unfollowing..."
          : "Following..."
        : profile.viewerIsFollowing
          ? "Unfollow"
          : "Follow"}
    </Button>
  );
}

export function MemberProfileClient({
  initialProfile,
}: MemberProfileClientProps) {
  const { profile, submitting, error, toggleFollow } = useMemberProfileFollow({
    initialProfile,
  });
  const joinedLabel = formatJoinDate(new Date(profile.joinedAt));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <div className="text-sm">
        <Link
          href="/analyses"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          &larr; Back to analyses
        </Link>
      </div>

      <Card>
        <CardHeader className="gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar profile={profile} />
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">
                {profile.username}
              </CardTitle>
              <CardDescription>Joined {joinedLabel}</CardDescription>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{formatCount(profile.followerCount, "followers")}</span>
                <span>{formatCount(profile.followingCount, "following")}</span>
              </div>
            </div>
          </div>

          <FollowAction
            profile={profile}
            submitting={submitting}
            onToggle={() => void toggleFollow()}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
            <h2 className="text-sm font-medium text-foreground">Bio</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {profile.bio?.trim().length
                ? profile.bio
                : "This member has not added a public bio yet."}
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
