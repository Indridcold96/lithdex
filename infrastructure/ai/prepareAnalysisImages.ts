import type { Readable } from "node:stream";

import type { AIAnalysisImageInput } from "@/domain/ai/AIAnalysisProvider";
import type { AnalysisImage } from "@/domain/entities/AnalysisImage";
import type { FileStorage } from "@/domain/storage/FileStorage";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Reads analysis image bytes from storage server-side and returns base64 +
// mime type. We deliberately do not use bucket URLs here so the bucket stays
// private and the AI provider never needs external access to our storage.
export async function prepareAnalysisImagesForAi(
  images: AnalysisImage[],
  fileStorage: FileStorage
): Promise<AIAnalysisImageInput[]> {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

  return Promise.all(
    sorted.map(async (image) => {
      const { body, contentType } = await fileStorage.read(image.storageKey);
      const buffer = await streamToBuffer(body);
      const resolvedMime =
        image.mimeType ?? contentType ?? "application/octet-stream";
      return {
        mimeType: resolvedMime,
        base64: buffer.toString("base64"),
      };
    })
  );
}
