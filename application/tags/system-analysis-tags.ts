import { AnalysisTagSource } from "@/domain/enums/AnalysisTagSource";
import type { AnalysisTagRepository } from "@/domain/repositories/AnalysisTagRepository";
import type { TagRepository } from "@/domain/repositories/TagRepository";

export interface NormalizedCanonicalTag {
  name: string;
  slug: string;
}

export interface ApplySystemAnalysisTagsDeps {
  tagRepository: TagRepository;
  analysisTagRepository: AnalysisTagRepository;
}

export const MAX_SYSTEM_ANALYSIS_TAGS = 3;
const MIN_CANONICAL_TAG_LENGTH = 2;
const MAX_CANONICAL_TAG_LENGTH = 40;

function toStableDisplayName(slug: string): string {
  return slug
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeCanonicalTag(
  value: string
): NormalizedCanonicalTag | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const ascii = trimmed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const slug = ascii
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (
    slug.length < MIN_CANONICAL_TAG_LENGTH ||
    slug.length > MAX_CANONICAL_TAG_LENGTH
  ) {
    return null;
  }

  if (!/[a-z]/.test(slug)) {
    return null;
  }

  return {
    slug,
    name: toStableDisplayName(slug),
  };
}

export function selectSystemAnalysisTags(
  values: readonly string[] | null | undefined
): NormalizedCanonicalTag[] {
  const selected: NormalizedCanonicalTag[] = [];
  const seenSlugs = new Set<string>();

  for (const value of values ?? []) {
    const normalized = normalizeCanonicalTag(value);
    if (!normalized || seenSlugs.has(normalized.slug)) {
      continue;
    }

    seenSlugs.add(normalized.slug);
    selected.push(normalized);

    if (selected.length >= MAX_SYSTEM_ANALYSIS_TAGS) {
      break;
    }
  }

  return selected;
}

export async function applySystemAnalysisTags(
  deps: ApplySystemAnalysisTagsDeps,
  input: {
    analysisId: string;
    rawTags: readonly string[] | null | undefined;
  }
): Promise<void> {
  const selected = selectSystemAnalysisTags(input.rawTags);
  if (selected.length === 0) {
    return;
  }

  const existing = await deps.analysisTagRepository.listByAnalysisId(
    input.analysisId
  );
  const existingSlugs = new Set(existing.map((analysisTag) => analysisTag.tag.slug));
  const existingSystemCount = existing.filter(
    (analysisTag) => analysisTag.sourceType === AnalysisTagSource.SYSTEM
  ).length;
  const remainingSlots = Math.max(
    MAX_SYSTEM_ANALYSIS_TAGS - existingSystemCount,
    0
  );

  if (remainingSlots === 0) {
    return;
  }

  let attachedCount = 0;

  for (const tagInput of selected) {
    if (existingSlugs.has(tagInput.slug)) {
      continue;
    }

    const canonical =
      (await deps.tagRepository.findBySlug(tagInput.slug)) ??
      (await deps.tagRepository.create(tagInput));

    await deps.analysisTagRepository.attach({
      analysisId: input.analysisId,
      tagId: canonical.id,
      sourceType: AnalysisTagSource.SYSTEM,
    });

    existingSlugs.add(tagInput.slug);
    attachedCount += 1;

    if (attachedCount >= remainingSlots) {
      break;
    }
  }
}
