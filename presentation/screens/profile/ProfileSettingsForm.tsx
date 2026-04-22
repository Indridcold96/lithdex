"use client";

import type { AuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";
import { MAX_USER_BIO_LENGTH } from "@/application/config/profile";
import { useProfileSettings } from "@/presentation/hooks/useProfileSettings";
import { PageHeader } from "@/presentation/components/PageHeader";
import { Alert, AlertDescription } from "@/presentation/ui/alert";
import { Button } from "@/presentation/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/ui/card";
import { Input } from "@/presentation/ui/input";
import { Label } from "@/presentation/ui/label";
import { Textarea } from "@/presentation/ui/textarea";

interface ProfileSettingsFormProps {
  initialUser: AuthenticatedUserDto;
}

export function ProfileSettingsForm({
  initialUser,
}: ProfileSettingsFormProps) {
  const {
    user,
    bio,
    setBio,
    saveState,
    avatarFile,
    avatarState,
    handleAvatarSelection,
    saveBio,
    uploadAvatar,
  } = useProfileSettings({ initialUser });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Profile settings"
        description="Manage the public profile information shown with your activity."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              Upload a public profile image. JPEG, PNG, and WebP are supported.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={`${user.username} avatar`}
                  className="size-28 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full border border-dashed border-border bg-muted text-3xl font-semibold text-muted-foreground">
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  Public avatar shown with comments and other community surfaces.
                </p>
              </div>
            </div>

            <form className="flex flex-col gap-3" onSubmit={uploadAvatar}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="avatar">Choose image</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelection}
                  disabled={avatarState.submitting}
                />
                <p className="text-xs text-muted-foreground">
                  {avatarFile ? `Selected: ${avatarFile.name}` : "No file selected."}
                </p>
              </div>

              {avatarState.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{avatarState.error}</AlertDescription>
                </Alert>
              ) : null}
              {avatarState.success ? (
                <Alert>
                  <AlertDescription>{avatarState.success}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={avatarState.submitting || !avatarFile}
              >
                {avatarState.submitting ? "Uploading..." : "Upload avatar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bio</CardTitle>
            <CardDescription>
              Add a short public description. Leave it blank if you prefer not to
              show one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={saveBio}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Public bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={6}
                  maxLength={MAX_USER_BIO_LENGTH}
                  disabled={saveState.submitting}
                  placeholder="Tell people a little about your collecting interests."
                />
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Shown publicly with your profile details.</span>
                  <span>
                    {bio.length} / {MAX_USER_BIO_LENGTH}
                  </span>
                </div>
              </div>

              {saveState.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{saveState.error}</AlertDescription>
                </Alert>
              ) : null}
              {saveState.success ? (
                <Alert>
                  <AlertDescription>{saveState.success}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={saveState.submitting}>
                  {saveState.submitting ? "Saving..." : "Save bio"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
