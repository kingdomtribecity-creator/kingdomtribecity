import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

export const r2Configured = Boolean(accountId && accessKeyId && secretAccessKey && bucketName);

const r2 = r2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

/** A short-lived URL the browser can PUT the file bytes to directly — they never touch our server. */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  if (!r2 || !bucketName) throw new Error("R2 is not configured.");
  const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
  return getSignedUrl(r2, command, { expiresIn: 300 });
}

/** Streams an object out of the (private) bucket — used by /api/media/[...key] when no public R2_PUBLIC_URL is set. */
export async function getObjectStream(key: string) {
  if (!r2 || !bucketName) throw new Error("R2 is not configured.");
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return r2.send(command);
}

/**
 * The URL to store/serve. Prefers a real public bucket domain (R2_PUBLIC_URL)
 * once configured; falls back to our own signed-proxy route so uploads work
 * from day one even on a private bucket.
 */
export function publicUrlForKey(key: string): string {
  const publicBase = process.env.R2_PUBLIC_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }
  return `/api/media/${key}`;
}
