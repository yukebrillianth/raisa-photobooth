import assert from "node:assert";
import { CONFIG } from "../src/config";
import { generateQrCode } from "../src/lib/qrcode";
import { handleUpload } from "../server/upload";

async function runCheck() {
  // 1. Verify CONFIG contains required robot endpoints
  assert.ok(
    CONFIG.streamUrl.includes("image_display"),
    "Stream URL must point to image_display",
  );
  assert.ok(
    CONFIG.snapshotUrl.includes("image_display"),
    "Snapshot URL must point to image_display",
  );

  // 2. Verify QR Code generation produces a valid data URL
  const qr = await generateQrCode("https://raisa-photo.yukebrillianth.com");
  assert.ok(
    qr.startsWith("data:image/png;base64,"),
    "QR Code must be a base64 data URL",
  );

  // 3. Verify backend upload to R2
  const dummyBuffer = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
    "base64",
  );
  console.log("Menguji upload ke Cloudflare R2 via backend...");
  const uploadRes = await handleUpload(dummyBuffer, dummyBuffer);
  assert.ok(
    uploadRes.rawDownloadUrl.startsWith("https://raisa-photo.yukebrillianth.com/"),
    "Raw URL must use public base URL",
  );
  assert.ok(
    uploadRes.overlayDownloadUrl.startsWith(
      "https://raisa-photo.yukebrillianth.com/",
    ),
    "Overlay URL must use public base URL",
  );

  console.log("✓ Upload R2 berhasil:");
  console.log("  Raw URL    :", uploadRes.rawDownloadUrl);
  console.log("  Overlay URL:", uploadRes.overlayDownloadUrl);
  console.log("✓ Self-check passed: Config, QR Code, dan Backend R2 verified.");
}

runCheck().catch((err) => {
  console.error("Self-check failed:", err);
  process.exit(1);
});
