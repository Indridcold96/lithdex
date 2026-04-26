import { fileTypeFromBuffer } from "file-type";

import {
  isAllowedImageMimeType,
  type AllowedImageMimeType,
} from "../config/uploads";
import { ValidationError } from "../errors";

export interface UploadedImageValidationInput {
  body: Buffer;
  mimeType: string;
}

export async function validateUploadedImage(
  file: UploadedImageValidationInput,
  label: string
): Promise<AllowedImageMimeType> {
  if (!isAllowedImageMimeType(file.mimeType)) {
    throw new ValidationError(
      `${label} has an unsupported mime type: ${file.mimeType}`
    );
  }

  const detected = await fileTypeFromBuffer(file.body);
  if (!detected) {
    throw new ValidationError(`${label} content could not be identified.`);
  }
  if (!isAllowedImageMimeType(detected.mime)) {
    throw new ValidationError(`${label} has unsupported image content.`);
  }
  if (detected.mime !== file.mimeType) {
    throw new ValidationError(
      `${label} content does not match its declared mime type.`
    );
  }

  return detected.mime;
}
