// NVIDIA provider configuration. Kept in a single place so the rest of the
// app never reads NVIDIA_* directly. Validation is lazy so build-time steps
// that do not need the provider don't trip this check.

const DEFAULT_VISION_MODEL = "meta/llama-4-maverick-17b-128e-instruct";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

export interface NvidiaAiEnv {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export function loadNvidiaAiEnv(): NvidiaAiEnv {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "NVIDIA_API_KEY is not set. The AI analysis provider cannot run."
    );
  }
  const model = process.env.NVIDIA_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL;
  const baseUrl = process.env.NVIDIA_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  return { apiKey, model, baseUrl };
}
