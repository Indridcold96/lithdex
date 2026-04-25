"use client";

import { useState } from "react";

import type { AnalysisImageDto } from "@/application/dto/AnalysisDto";
import { cn } from "@/lib/utils";

interface AnalysisGalleryProps {
  images: AnalysisImageDto[];
}

export function AnalysisGallery({ images }: AnalysisGalleryProps) {
  const [activeId, setActiveId] = useState<string | null>(
    images[0]?.id ?? null
  );

  if (images.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No images available.
      </div>
    );
  }

  const active = images.find((img) => img.id === activeId) ?? images[0];

  return (
    <section className="flex flex-col gap-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted sm:aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={
            active.originalFilename ?? `Image ${active.sortOrder + 1} of analysis`
          }
          className="h-full w-full object-contain"
        />
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {images.map((image) => {
            const isActive = image.id === active.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveId(image.id)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border bg-muted transition",
                  isActive
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-foreground/30"
                )}
                aria-label={`Show image ${image.sortOrder + 1}`}
                aria-current={isActive}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={
                    image.originalFilename ??
                    `Image ${image.sortOrder + 1} thumbnail`
                  }
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
