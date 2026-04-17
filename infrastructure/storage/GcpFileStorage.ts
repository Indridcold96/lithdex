import { Storage, type Bucket } from "@google-cloud/storage";

import type {
  FileStorage,
  ReadResult,
  UploadInput,
} from "@/domain/storage/FileStorage";

import { gcpBucketName, gcpProjectId } from "./env";

let cachedBucket: Bucket | null = null;

function getBucket(): Bucket {
  if (cachedBucket) return cachedBucket;
  const storage = new Storage({ projectId: gcpProjectId });
  cachedBucket = storage.bucket(gcpBucketName);
  return cachedBucket;
}

export class GcpFileStorage implements FileStorage {
  async upload(input: UploadInput): Promise<void> {
    const file = getBucket().file(input.key);
    await file.save(input.body, {
      contentType: input.contentType,
      resumable: false,
      metadata: { contentType: input.contentType },
    });
  }

  async read(key: string): Promise<ReadResult> {
    const file = getBucket().file(key);
    const [metadata] = await file.getMetadata();

    const contentType =
      typeof metadata.contentType === "string"
        ? metadata.contentType
        : "application/octet-stream";

    const rawSize = metadata.size;
    const contentLength =
      typeof rawSize === "number"
        ? rawSize
        : typeof rawSize === "string"
          ? Number.parseInt(rawSize, 10)
          : null;

    return {
      body: file.createReadStream(),
      contentType,
      contentLength:
        typeof contentLength === "number" && Number.isFinite(contentLength)
          ? contentLength
          : null,
    };
  }

  async delete(key: string): Promise<void> {
    await getBucket().file(key).delete({ ignoreNotFound: true });
  }
}
