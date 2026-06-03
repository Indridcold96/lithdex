export interface NormalizedCanonicalTag {
  name: string;
  slug: string;
}

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
