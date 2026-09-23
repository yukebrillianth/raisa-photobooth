import { CONFIG } from "../config";

export interface CapturedResult {
  rawBlob: Blob;
  rawUrl: string;
  overlayBlob: Blob;
  overlayUrl: string;
  timestamp: number;
}

export interface UploadResult {
  rawDownloadUrl: string;
  overlayDownloadUrl: string;
}

/**
 * Fetch snapshot from camera endpoint with timestamp cache-buster.
 */
export async function fetchSnapshot(
  snapshotUrl: string = CONFIG.snapshotUrl,
): Promise<Blob> {
  const url = `${snapshotUrl}${snapshotUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Gagal mengambil snapshot: ${res.status} ${res.statusText}`);
  }
  return res.blob();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Composite raw photo behind 16:9 1920x1080 overlay frame.
 * Photo is 1280x720 centered at (320, 180).
 */
export async function renderOverlayPhoto(rawBlob: Blob): Promise<Blob> {
  const rawUrl = URL.createObjectURL(rawBlob);
  const rawImg = await loadImage(rawUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context 2D tidak tersedia");

  // Canvas size: 16:9 1920x1080
  canvas.width = 1920;
  canvas.height = 1080;

  // Background behind the photo
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Draw raw photo behind frame: 1280x720 centered at (320, 180)
  const photoW = 1280;
  const photoH = 720;
  const photoX = (canvas.width - photoW) / 2; // 320
  const photoY = (canvas.height - photoH) / 2; // 180

  ctx.drawImage(rawImg, photoX, photoY, photoW, photoH);

  // 2. Draw overlay frame on top (1920x1080)
  try {
    const overlayImg = await loadImage(CONFIG.overlayUrl);
    ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.warn("Gagal memuat custom overlay, menggunakan fallback border ITS:", err);
    ctx.strokeStyle = "#007bc0";
    ctx.lineWidth = 12;
    ctx.strokeRect(photoX, photoY, photoW, photoH);
  }

  URL.revokeObjectURL(rawUrl);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Gagal membuat Blob overlay"));
      },
      "image/jpeg",
      0.95,
    );
  });
}

/**
 * Upload photos to backend server (/api/upload), which securely stores them in S3/R2.
 */
export async function uploadPhotos(
  rawBlob: Blob,
  overlayBlob: Blob,
): Promise<UploadResult> {
  try {
    const [rawBase64, overlayBase64] = await Promise.all([
      blobToBase64(rawBlob),
      blobToBase64(overlayBlob),
    ]);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw: rawBase64,
        overlay: overlayBase64,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.rawDownloadUrl && data.overlayDownloadUrl) {
      return {
        rawDownloadUrl: data.rawDownloadUrl,
        overlayDownloadUrl: data.overlayDownloadUrl,
      };
    }
  } catch (err) {
    console.warn("Upload backend gagal, fallback ke link lokal:", err);
  }

  // Fallback for local testing / offline kiosk
  return {
    rawDownloadUrl: URL.createObjectURL(rawBlob),
    overlayDownloadUrl: URL.createObjectURL(overlayBlob),
  };
}
