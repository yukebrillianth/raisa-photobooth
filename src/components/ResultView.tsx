/* eslint-disable @typescript-eslint/no-unused-vars */
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
    <div className="flex h-full w-full max-w-3xl flex-col justify-between overflow-y-auto py-2">
      {/* Kiosk Section Header */}
      <div className="flex items-end justify-between border-b border-[var(--color-surface-3)] pb-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">
            Kenang-kenangan Digital
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--color-primary)]">
            Foto Anda Sudah Siap
          </h2>
        </div>
        <p className="font-mono text-xs text-[var(--color-text-muted)]">
          {new Date(captured.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          WIB
        </p>
      </div>

      {/* Main Container */}
      <div className="my-auto flex flex-col gap-6 py-4">
        {/* Photo + QR Unified Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-surface-3)] bg-white p-6 shadow-[var(--shadow-soft)]">
          {/* Segmented Version Switcher */}
          <div className="flex items-center justify-between border-b border-[var(--color-surface-3)] pb-4">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                Pilih Versi Unduhan
              </p>
              <p className="font-body text-xs text-[var(--color-text-muted)] mt-0.5">
                {isOverlay
                  ? "Dilengkapi bingkai kenang-kenangan Robot RAISA ITS"
                  : "Resolusi penuh 1920 × 1080 langsung dari kamera"}
              </p>
            </div>

            <div className="flex rounded-[var(--radius-md)] border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("overlay")}
                className={`rounded-md px-4 py-2 font-display font-semibold tracking-wider transition-colors ${
                  isOverlay
                    ? "border border-[var(--color-surface-3)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                FRAME ITS
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`rounded-md px-4 py-2 font-display font-semibold tracking-wider transition-colors ${
                  !isOverlay
                    ? "border border-[var(--color-surface-3)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                FOTO ASLI
              </button>
            </div>
          </div>

          {/* Side-by-side: Photo Preview & QR Code */}
          <div className="mt-6 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            {/* Left: Captured Photo Preview */}
            <div className="flex flex-col items-center">
              <div className="relative flex max-h-[340px] w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-2">
                <img
                  src={isOverlay ? captured.overlayUrl : captured.rawUrl}
                  alt={isOverlay ? "Foto Frame ITS" : "Foto Asli"}
                  className="max-h-[320px] w-auto rounded object-contain"
                />
              </div>
              <p className="font-mono text-xs text-[var(--color-text-muted)] mt-2">
                {isOverlay ? "1920 × 1080 • JPEG • Frame ITS" : "1920 × 1080 • JPEG • Raw 16:9"}
              </p>
            </div>

            {/* Right: QR Code & Instructions */}
            <div className="flex flex-col items-center justify-center border-t border-[var(--color-surface-3)] pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-4">
                {currentQr ? (
                  <img
                    src={currentQr}
                    alt="Kode QR Unduhan"
                    className="h-56 w-56 rounded-md bg-white p-2 object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-md bg-white text-xs text-[var(--color-text-muted)] font-mono">
                    Membuat QR...
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <p className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
                  Pindai dengan Kamera HP
                </p>
                <p className="font-body text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Arahkan kamera ke kode QR untuk mengunduh berkas
                </p>
              </div>

              {/* <a
                href={currentUrl}
                download={currentFileName}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex min-h-[var(--touch-min)] w-full max-w-xs items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-surface-3)] bg-white px-4 py-2 font-display text-xs font-semibold tracking-wider text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5m-5 5V3" />
                </svg>
                UNDUH KE PERANGKAT INI
              </a> */}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action matching raisa-chat */}
      <div className="flex flex-col items-center gap-3 border-t border-[var(--color-surface-3)] pt-4">
        <button
          type="button"
          onClick={onReset}
          className="group relative flex h-14 w-full max-w-sm items-center justify-center rounded-[var(--radius-lg)] border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
            borderColor: "var(--color-primary-dark)",
            boxShadow: "0 4px 24px rgba(0,123,192,0.35)",
          }}
        >
          <span className="font-display text-base font-semibold tracking-[0.2em] text-white">
            SELESAI / FOTO BARU
          </span>
        </button>

        <p className="font-mono text-xs text-[var(--color-text-muted)]">
          Kembali ke layar utama otomatis dalam {autoResetTimer}s
        </p>
      </div>
    </div>
  );
}
