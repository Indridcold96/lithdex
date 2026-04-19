"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type SubmitEvent } from "react";

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
import { PageHeader } from "@/presentation/components/PageHeader";

interface AnalysisResponse {
  id: string;
}

const MIN_FILES = 3;
const MAX_FILES = 12;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

export function NewAnalysisScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files ? Array.from(event.target.files) : [];
    setFiles(picked);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (files.length < MIN_FILES) {
      setError(`Please select at least ${MIN_FILES} images.`);
      return;
    }
    if (files.length > MAX_FILES) {
      setError(`Please select at most ${MAX_FILES} images.`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_MIMES.includes(file.type)) {
        setError(`Unsupported file type: ${file.type || "unknown"}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (title.trim()) formData.append("title", title.trim());
      formData.append("visibility", visibility);
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/analyses", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Upload failed.");
        return;
      }

      const data = (await res.json()) as AnalysisResponse;
      router.replace(`/analyses/${data.id}/session`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="New analysis"
        description="Upload at least 3 images (JPEG, PNG, or WebP) to start a new analysis."
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload images</CardTitle>
          <CardDescription>
            Images are stored privately. You decide whether the analysis is
            public or private.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visibility">Visibility</Label>
              <select
                id="visibility"
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "public" | "private")
                }
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="files">Images ({MIN_FILES}-{MAX_FILES})</Label>
              <Input
                id="files"
                type="file"
                accept={ALLOWED_MIMES.join(",")}
                multiple
                onChange={handleFilesChange}
              />
              {files.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {files.length} file{files.length === 1 ? "" : "s"} selected.
                </p>
              ) : null}
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Uploading..." : "Create analysis"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
