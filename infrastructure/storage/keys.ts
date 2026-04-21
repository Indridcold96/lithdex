import { randomUUID } from "node:crypto";

import {
  extensionForMimeType,
  type AllowedImageMimeType,
} from "@/application/config/uploads";

export function buildAnalysisImageStorageKey(args: {
  analysisId: string;
  sortOrder: number;
  mimeType: AllowedImageMimeType;
}): string {
  const { analysisId, sortOrder, mimeType } = args;
  const ext = extensionForMimeType(mimeType);
  const paddedOrder = String(sortOrder).padStart(2, "0");
  return `analyses/${analysisId}/${paddedOrder}-${randomUUID()}.${ext}`;
}

export function buildUserAvatarStorageKey(args: {
  userId: string;
  mimeType: AllowedImageMimeType;
}): string {
  const { userId, mimeType } = args;
  const ext = extensionForMimeType(mimeType);
  return `users/${userId}/avatar-${randomUUID()}.${ext}`;
}
