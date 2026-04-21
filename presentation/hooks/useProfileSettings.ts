"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import type { AuthenticatedUserDto } from "@/application/dto/AuthenticatedUserDto";

interface UseProfileSettingsInput {
  initialUser: AuthenticatedUserDto;
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

export function useProfileSettings({ initialUser }: UseProfileSettingsInput) {
  const [user, setUser] = useState(initialUser);
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [saveState, setSaveState] = useState<{
    submitting: boolean;
    error: string | null;
    success: string | null;
  }>({
    submitting: false,
    error: null,
    success: null,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarState, setAvatarState] = useState<{
    submitting: boolean;
    error: string | null;
    success: string | null;
  }>({
    submitting: false,
    error: null,
    success: null,
  });

  function handleAvatarSelection(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setAvatarFile(nextFile);
    setAvatarState((prev) => ({
      ...prev,
      error: null,
      success: null,
    }));
  }

  async function saveBio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState({
      submitting: true,
      error: null,
      success: null,
    });

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Could not save profile."));
      }

      const updatedUser = (await res.json()) as AuthenticatedUserDto;
      setUser(updatedUser);
      setBio(updatedUser.bio ?? "");
      setSaveState({
        submitting: false,
        error: null,
        success: "Profile saved.",
      });
    } catch (err) {
      setSaveState({
        submitting: false,
        error: err instanceof Error ? err.message : "Unexpected error.",
        success: null,
      });
    }
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!avatarFile) {
      setAvatarState({
        submitting: false,
        error: "Select an image to upload.",
        success: null,
      });
      return;
    }

    setAvatarState({
      submitting: true,
      error: null,
      success: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", avatarFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(
          await readErrorMessage(res, "Could not upload avatar.")
        );
      }

      const updatedUser = (await res.json()) as AuthenticatedUserDto;
      setUser(updatedUser);
      setAvatarFile(null);
      setAvatarState({
        submitting: false,
        error: null,
        success: "Avatar updated.",
      });
    } catch (err) {
      setAvatarState({
        submitting: false,
        error: err instanceof Error ? err.message : "Unexpected error.",
        success: null,
      });
    }
  }

  return {
    user,
    bio,
    setBio,
    saveState,
    avatarFile,
    avatarState,
    handleAvatarSelection,
    saveBio,
    uploadAvatar,
  };
}
