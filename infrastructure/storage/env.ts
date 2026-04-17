const BUCKET = process.env.GCP_BUCKET_NAME;
const PROJECT_ID = process.env.GCP_PROJECT_ID;

if (!BUCKET) {
  throw new Error("GCP_BUCKET_NAME env var must be set.");
}
if (!PROJECT_ID) {
  throw new Error("GCP_PROJECT_ID env var must be set.");
}

export const gcpBucketName: string = BUCKET;
export const gcpProjectId: string = PROJECT_ID;
