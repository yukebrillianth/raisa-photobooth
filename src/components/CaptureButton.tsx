interface CaptureButtonProps {
  countdown?: number;
  isCounting: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function CaptureButton({
  countdown,
  isCounting,
  disabled = false,
  onPress,
}: CaptureButtonProps) {
  const label = isCounting ? `BERPOSE... ${countdown}` : "AMBIL FOTO";

  return (
    <div className="relative flex shrink-0 flex-col items-center gap-4 px-6 pb-8 pt-2 sm:px-8">
      <div className="relative">
        {/* Pulsing rings matching raisa-chat MicButton */}
        {isCounting && (
          <>
            <span
              className="absolute inset-0 animate-[pulseRing_2s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full opacity-50"
              style={{ boxShadow: "0 0 0 0 var(--color-primary-dark)" }}
              aria-hidden="true"
            />
            <span
              className="absolute inset-0 animate-[pulseRing_2s_cubic-bezier(0.4,0,0.6,1)_infinite_700ms] rounded-full opacity-40"
              style={{ boxShadow: "0 0 0 0 var(--color-primary-dark)" }}
              aria-hidden="true"
            />
          </>
        )}

        <button
          type="button"
          onClick={onPress}
          disabled={disabled || isCounting}
          aria-label={label}
          className="group relative flex h-[var(--mic-size)] w-[var(--mic-size)] items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
            borderColor: "var(--color-primary-dark)",
            boxShadow: "0 4px 24px rgba(0,123,192,0.35)",
          }}
        >
          {isCounting ? (
            <span className="font-display text-5xl font-bold text-white transition-transform duration-200">
              {countdown}
            </span>
          ) : (
            <svg
              className="relative h-14 w-14 text-white transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          )}
        </button>
      </div>

      <p className="relative font-display text-[length:var(--text-button)] font-semibold tracking-[0.2em] text-[var(--color-text-primary)]">
        {label}
      </p>
    </div>
  );
}
