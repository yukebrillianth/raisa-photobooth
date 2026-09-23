interface StatusBarProps {
  status: "ready" | "countdown" | "processing" | "review" | "result" | "error";
  orgName?: string;
}

const STATUS_CONFIG: Record<
  StatusBarProps["status"],
  { text: string; dotClass: string; textClass: string }
> = {
  ready: {
    text: "Siap",
    dotClass: "bg-[var(--color-success)]",
    textClass: "text-[var(--color-success)]",
  },
  countdown: {
    text: "Bersiap...",
    dotClass: "bg-[var(--color-warning)] animate-pulse",
    textClass: "text-[var(--color-warning)]",
  },
  processing: {
    text: "Memproses",
    dotClass: "bg-[var(--color-secondary)] animate-pulse",
    textClass: "text-[var(--color-secondary)]",
  },
  review: {
    text: "Pilih Hasil",
    dotClass: "bg-[var(--color-info)]",
    textClass: "text-[var(--color-info)]",
  },
  result: {
    text: "Selesai",
    dotClass: "bg-[var(--color-primary)]",
    textClass: "text-[var(--color-primary)]",
  },
  error: {
    text: "Gangguan Kamera",
    dotClass: "bg-[var(--color-danger)]",
    textClass: "text-[var(--color-danger)]",
  },
};

export function StatusBar({
  status,
  orgName = "Institut Teknologi Sepuluh Nopember",
}: StatusBarProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.ready;

  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-[var(--color-surface-3)] px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2 pl-14">
        <span
          className={`h-2 w-2 rounded-full ${config.dotClass} transition-colors duration-300`}
        />
        <p
          className={`font-body text-[length:var(--text-status)] font-semibold tracking-wide transition-colors duration-300 ${config.textClass}`}
        >
          {config.text}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img
            alt="ITS Logo"
            loading="lazy"
            width="100"
            height="100"
            decoding="async"
            src="/logo-its-biru.png"
            className="h-11 w-auto object-contain"
          />
          <div className="h-12 w-[0.0625rem] rounded-full bg-[var(--color-primary)]" />
          <div className="flex flex-col items-start">
            <h1 className="font-display text-[length:var(--text-h2)] leading-tight tracking-tight text-[var(--color-primary)]">
              RAISA
            </h1>
            <p className="font-body text-start text-xs leading-tight text-[var(--color-text-secondary)]">
              {orgName}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
