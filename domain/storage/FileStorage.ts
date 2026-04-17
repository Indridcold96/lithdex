import type { Readable } from "node:stream";

export interface UploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface ReadResult {
  body: Readable;
  contentType: string;
  contentLength: number | null;
}

export interface FileStorage {
  upload(input: UploadInput): Promise<void>;
  read(key: string): Promise<ReadResult>;
  delete(key: string): Promise<void>;
}
