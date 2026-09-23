import { useCallback, useEffect, useRef, useState } from "react";
import { CaptureButton } from "./components/CaptureButton";
import { ResultView } from "./components/ResultView";
import { StatusBar } from "./components/StatusBar";
import { CONFIG } from "./config";
import {
  fetchSnapshot,
  renderOverlayPhoto,
  uploadPhotos,
  type CapturedResult,
  type UploadResult,
} from "./lib/photo";
import { generateQrCode } from "./lib/qrcode";

type Stage = "preview" | "countdown" | "processing" | "review" | "result";

function playSound(type: "beep" | "shutter") {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "beep") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Audio unsupported or disabled in kiosk environment
  }
}

export default function App() {
  const [stage, setStage] = useState<Stage>("preview");
  const [countdown, setCountdown] = useState<number>(3);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [flash, setFlash] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<boolean>(false);

  const [captured, setCaptured] = useState<CapturedResult | null>(null);
  const [activePreview, setActivePreview] = useState<"overlay" | "raw">("overlay");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [rawQrCode, setRawQrCode] = useState<string>("");
  const [overlayQrCode, setOverlayQrCode] = useState<string>("");
  const [autoResetTimer, setAutoResetTimer] = useState<number>(60);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hand control back to the robot's Electron shell (same as raisa-chat)
  const backToElectron = useCallback(() => {
    fetch("http://localhost:9999/kill-chrome", { method: "POST" }).catch(() => undefined);
  }, []);

  // Auto-reset timer when on result screen
  useEffect(() => {
    if (stage !== "result") return;
    setAutoResetTimer(60);
    const interval = setInterval(() => {
      setAutoResetTimer((prev) => {
        if (prev <= 1) {
          handleReset();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const startCountdown = () => {
    setCountdown(3);
    setStage("countdown");
    playSound("beep");

    let current = 3;
    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
        playSound("beep");
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        triggerCapture();
      }
    }, 1000);
  };

  const triggerCapture = async () => {
    playSound("shutter");
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    setStage("processing");

    try {
      const rawBlob = await fetchSnapshot();
      const rawUrl = URL.createObjectURL(rawBlob);

      const overlayBlob = await renderOverlayPhoto(rawBlob);
      const overlayUrl = URL.createObjectURL(overlayBlob);

      setCaptured({
        rawBlob,
        rawUrl,
        overlayBlob,
        overlayUrl,
        timestamp: Date.now(),
      });
      setActivePreview("overlay");
      setStage("review");
    } catch (err) {
      console.error("Gagal mengambil snapshot:", err);
      alert("Gagal mengambil snapshot kamera robot. Periksa koneksi web_video_server.");
      setStage("preview");
    }
  };

  const handleProceedToResult = async () => {
    if (!captured) return;
    setStage("processing");

    try {
      const result = await uploadPhotos(captured.rawBlob, captured.overlayBlob);
      setUploadResult(result);

      const [rawQr, overlayQr] = await Promise.all([
        generateQrCode(result.rawDownloadUrl),
        generateQrCode(result.overlayDownloadUrl),
      ]);

      setRawQrCode(rawQr);
      setOverlayQrCode(overlayQr);
      setStage("result");
    } catch (err) {
      console.error("Gagal memproses hasil:", err);
      alert("Gagal memproses upload foto.");
      setStage("review");
    }
  };

  const handleReset = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (captured) {
      URL.revokeObjectURL(captured.rawUrl);
      URL.revokeObjectURL(captured.overlayUrl);
    }
    setCaptured(null);
    setUploadResult(null);
    setRawQrCode("");
    setOverlayQrCode("");
    setStage("preview");
  };

  const currentStatus = streamError
    ? "error"
    : stage === "countdown"
      ? "countdown"
      : stage === "processing"
        ? "processing"
        : stage === "review"
          ? "review"
          : stage === "result"
            ? "result"
            : "ready";

  return (
    <div className="flex flex-col h-[100dvh] w-full select-none overflow-hidden bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
      {/* Flash shutter effect */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 bg-white transition-opacity duration-300 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Back button (matching raisa-chat) */}
      <button
        type="button"
        onClick={backToElectron}
        aria-label="Kembali"
        className="absolute left-4 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Navbar with only border, NO shadow */}
      <StatusBar status={currentStatus} />

      {/* Main Kiosk Body */}
      <main className="relative flex flex-1 flex-col items-center justify-between overflow-hidden px-6 py-4 sm:px-8">
        {/* Stage 1: Preview & Countdown */}
        {(stage === "preview" || stage === "countdown") && (
          <div className="flex h-full w-full max-w-4xl flex-col items-center justify-between">
            {/* Overlay Toggle Switcher */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                Pratinjau:
              </span>
              <div className="flex rounded border border-[var(--color-surface-3)] bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowOverlay(true)}
                  className={`rounded px-3 py-3 font-display font-semibold tracking-wider transition-colors ${
                    showOverlay
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:text-black"
                  }`}
                >
                  DENGAN FRAME
                </button>
                <button
                  type="button"
                  onClick={() => setShowOverlay(false)}
                  className={`rounded px-3 py-3 font-display font-semibold tracking-wider transition-colors ${
                    !showOverlay
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:text-black"
                  }`}
                >
                  KAMERA POLOS
                </button>
              </div>
            </div>

            {/* Viewfinder Frame (16:9 container) */}
            <div className="relative flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-surface-3)] bg-black shadow-[var(--shadow-soft)]">
              {showOverlay ? (
                <>
                  {/* Camera stream positioned at 1280x720 centered behind 1920x1080 (320, 180) */}
                  <img
                    src={CONFIG.streamUrl}
                    alt="Camera Stream"
                    onError={() => setStreamError(true)}
                    onLoad={() => setStreamError(false)}
                    className="absolute left-[16.6667%] top-[16.6667%] h-[66.6667%] w-[66.6667%] object-cover"
                  />
                  {/* Overlay Frame placed on top */}
                  <img
                    src={CONFIG.overlayUrl}
                    alt="Frame Overlay"
                    className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
                  />
                </>
              ) : (
                /* Full 16:9 raw stream */
                <img
                  src={CONFIG.streamUrl}
                  alt="Camera Stream"
                  onError={() => setStreamError(true)}
                  onLoad={() => setStreamError(false)}
                  className="h-full w-full object-contain"
                />
              )}

              {/* Viewfinder corner guides */}
              {!showOverlay && (
                <div className="pointer-events-none absolute inset-6 flex flex-col justify-between border-2 border-white/20 rounded-xl">
                  <div className="flex justify-between p-3">
                    <div className="h-6 w-6 border-l-2 border-t-2 border-[var(--color-primary-light)]" />
                    <div className="h-6 w-6 border-r-2 border-t-2 border-[var(--color-primary-light)]" />
                  </div>
                  <div className="flex justify-between p-3">
                    <div className="h-6 w-6 border-l-2 border-b-2 border-[var(--color-primary-light)]" />
                    <div className="h-6 w-6 border-r-2 border-b-2 border-[var(--color-primary-light)]" />
                  </div>
                </div>
              )}

              {/* Central countdown indicator in viewfinder */}
              {stage === "countdown" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
                  <span className="font-display text-8xl font-bold text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                    {countdown}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Capture Button (matches raisa-chat MicButton 140px gradient circle) */}
            <CaptureButton
              countdown={countdown}
              isCounting={stage === "countdown"}
              disabled={streamError}
              onPress={startCountdown}
            />
          </div>
        )}

        {/* Stage 2: Processing Spinner */}
        {stage === "processing" && (
          <div className="my-auto flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--color-surface-2)] border-t-[var(--color-primary)]" />
            <p className="font-display text-lg font-semibold text-[var(--color-secondary)]">
              Memproses Foto...
            </p>
          </div>
        )}

        {/* Stage 3: Review */}
        {stage === "review" && captured && (
          <div className="flex h-full w-full max-w-3xl flex-col items-center justify-between py-2">
            <div className="w-full text-center border-b border-[var(--color-surface-3)] pb-2">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-text-secondary)]">
                Pratinjau Hasil
              </p>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-[var(--color-primary)]">
                Tinjau Foto Anda
              </h2>
            </div>

            {/* Toggle Preview: Overlay vs Raw */}
            <div className="my-2 flex rounded-[var(--radius-md)] border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-1 text-xs">
              <button
                type="button"
                onClick={() => setActivePreview("overlay")}
                className={`rounded-md px-4 py-2 font-display font-semibold tracking-wider transition-colors ${
                  activePreview === "overlay"
                    ? "border border-[var(--color-surface-3)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                FRAME SOUVENIR
              </button>
              <button
                type="button"
                onClick={() => setActivePreview("raw")}
                className={`rounded-md px-4 py-2 font-display font-semibold tracking-wider transition-colors ${
                  activePreview === "raw"
                    ? "border border-[var(--color-surface-3)] bg-white text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                FOTO ASLI (RAW)
              </button>
            </div>

            {/* Photo preview container: 16:9 container */}
            <div className="relative flex aspect-video max-h-[52dvh] w-full items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-surface-3)] bg-white p-2 shadow-[var(--shadow-soft)]">
              <img
                src={activePreview === "overlay" ? captured.overlayUrl : captured.rawUrl}
                alt="Hasil Jepretan"
                className="h-full w-full rounded object-contain"
              />
            </div>

            {/* Action buttons matching OperatorPanel style */}
            <div className="mt-4 flex w-full max-w-md items-center justify-center gap-4 pb-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex min-h-[var(--touch-min)] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-surface-3)] bg-white px-4 py-3 font-display text-sm font-semibold tracking-wider uppercase text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 active:scale-98"
              >
                Foto Ulang
              </button>
              <button
                type="button"
                onClick={handleProceedToResult}
                className="flex min-h-[var(--touch-min)] flex-1 items-center justify-center rounded-[var(--radius-md)] border-2 border-[var(--color-primary-dark)] px-4 py-3 font-display text-sm font-semibold tracking-wider uppercase text-white transition-all hover:scale-[1.02] active:scale-98"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                  boxShadow: "0 4px 20px rgba(0,123,192,0.3)",
                }}
              >
                Simpan & Buat QR
              </button>
            </div>
          </div>
        )}

        {/* Stage 4: Result & QR Code (Clean ITS Kiosk Souvenir View) */}
        {stage === "result" && captured && (
          <ResultView
            captured={captured}
            uploadResult={uploadResult}
            rawQrCode={rawQrCode}
            overlayQrCode={overlayQrCode}
            autoResetTimer={autoResetTimer}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
