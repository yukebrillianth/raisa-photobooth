import { useState } from "react";
import type { CapturedResult, UploadResult } from "../lib/photo";

interface ResultViewProps {
  captured: CapturedResult;
  uploadResult: UploadResult | null;
  rawQrCode: string;
  overlayQrCode: string;
  autoResetTimer: number;
  onReset: () => void;
}

export function ResultView({
  captured,
  uploadResult,
  rawQrCode,
  overlayQrCode,
  autoResetTimer,
  onReset,
}: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<"overlay" | "raw">("overlay");

  const isOverlay = activeTab === "overlay";
  const currentQr = isOverlay ? overlayQrCode : rawQrCode;
  const currentUrl = isOverlay
    ? uploadResult?.overlayDownloadUrl || captured.overlayUrl
    : uploadResult?.rawDownloadUrl || captured.rawUrl;
  const currentFileName = isOverlay ? "raisa_photobooth_frame.jpg" : "raisa_photobooth_raw.jpg";

  return (
    <div className="flex w-full max-w-full flex-col items-center gap-5 py-2">
      {/* Section Header */}
      <div className="w-full text-center border-b border-[var(--color-surface-3)] pb-3">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">
          Kenang-kenangan Digital
        </p>
        <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-primary)]">
          Foto Anda Sudah Siap
        </h2>
        <p className="mt-1 font-body text-xs sm:text-sm text-[var(--color-text-secondary)]">
          Pindai kode QR menggunakan kamera HP untuk mengunduh
        </p>
      </div>

      {/* Segmented Version Switcher */}
      <div className="flex rounded-[var(--radius-lg)] border border-[var(--color-surface-3)] bg-white p-1 shadow-sm text-xs sm:text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("overlay")}
          className={`rounded-md px-5 py-2 font-display font-semibold tracking-wider transition-colors ${
            isOverlay
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          FRAME ITS (SOUVENIR)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("raw")}
          className={`rounded-md px-5 py-2 font-display font-semibold tracking-wider transition-colors ${
            !isOverlay
              ? "bg-[var(--color-primary)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          FOTO ASLI (RAW 16:9)
        </button>
      </div>

      {/* Main Unified Card: Photo Preview & QR Code */}
      <div className="flex w-full flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-[var(--color-surface-3)] bg-white p-4 sm:p-5 shadow-[var(--shadow-soft)]">
        {/* Photo thumbnail */}
        <div className="relative flex aspect-video max-h-[220px] w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-1.5">
          <img
            src={isOverlay ? captured.overlayUrl : captured.rawUrl}
            alt={isOverlay ? "Foto Frame ITS" : "Foto Asli"}
            className="h-full w-full rounded object-contain"
          />
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-3">
          {currentQr ? (
            <img
              src={currentQr}
              alt="Kode QR Unduhan"
              className="h-48 w-48 rounded bg-white p-2 object-contain"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded bg-white text-xs text-[var(--color-text-muted)] font-mono">
              Membuat QR...
            </div>
          )}
        </div>

        <p className="font-mono text-xs text-[var(--color-text-muted)]">
          {isOverlay ? "1920 × 1080 • JPEG • Frame ITS" : "1920 × 1080 • JPEG • Raw 16:9"}
        </p>

        {uploadResult && (
          <a
            href={currentUrl}
            download={currentFileName}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            Buka tautan unduhan langsung
          </a>
        )}
      </div>

      {/* Footer Action */}
      <div className="flex w-full flex-col items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onReset}
          className="flex min-h-[58px] w-full items-center justify-center rounded-[var(--radius-lg)] border-2 border-[var(--color-primary-dark)] px-6 font-display text-base font-bold tracking-[0.15em] text-white shadow-md transition-all active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
            boxShadow: "0 4px 20px rgba(0,123,192,0.35)",
          }}
        >
          SELESAI / FOTO BARU
        </button>

        <p className="font-mono text-xs text-[var(--color-text-muted)]">
          Layar kembali otomatis dalam {autoResetTimer} detik
        </p>
      </div>
    </div>
  );
}
