import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Resolve .env relative to project root regardless of cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

export async function handleUpload(
  rawBuffer: Buffer,
  overlayBuffer: Buffer,
): Promise<{ rawDownloadUrl: string; overlayDownloadUrl: string }> {
  const endpoint = process.env.S3_ENDPOINT || process.env.VITE_S3_ENDPOINT;
  const bucket =
    process.env.S3_BUCKET || process.env.VITE_S3_BUCKET || "raisa-photobooth";
  const region =
    process.env.S3_REGION || process.env.VITE_S3_REGION || "auto";
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID || process.env.VITE_S3_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.VITE_S3_SECRET_ACCESS_KEY;
  const publicBaseUrl =
    process.env.S3_PUBLIC_BASE_URL || process.env.VITE_S3_PUBLIC_BASE_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error("Missing S3 credentials:", {
      endpoint: !!endpoint,
      bucket: !!bucket,
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
      envPath,
      envFileExists: fs.existsSync(envPath),
    });
    throw new Error(
      "S3 / R2 credentials tidak lengkap. Periksa S3_ENDPOINT, S3_ACCESS_KEY_ID, dan S3_SECRET_ACCESS_KEY di .env",
    );
  }

  const s3 = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const timestamp = Date.now();
  const rawFilename = `raisa_raw_${timestamp}.jpg`;
  const overlayFilename = `raisa_overlay_${timestamp}.jpg`;

  await Promise.all([
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: rawFilename,
        Body: rawBuffer,
        ContentType: "image/jpeg",
      }),
    ),
    s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: overlayFilename,
        Body: overlayBuffer,
        ContentType: "image/jpeg",
      }),
    ),
  ]);

  const publicBase = publicBaseUrl
    ? publicBaseUrl.replace(/\/$/, "")
    : `${endpoint.replace(/\/$/, "")}/${bucket}`;

  return {
    rawDownloadUrl: `${publicBase}/${rawFilename}`,
    overlayDownloadUrl: `${publicBase}/${overlayFilename}`,
  };
}
