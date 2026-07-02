/**
 * ErrorState — §113 compliant error pattern.
 * Design: danger icon (circle-info svg) + cause text + optional retry button.
 * Used by list/panel surfaces when data fails to load.
 */

type Props = {
  /** Human-readable error cause shown beneath the icon. */
  message: string;
  /** Called when the user clicks the retry button. Omit to hide the button. */
  onRetry?: () => void;
  /** Label for the retry button. Defaults to "Retry". */
  retryLabel?: string;
  /** data-testid forwarded to the root element for testing. */
  'data-testid'?: string;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Retry',
  'data-testid': testId = 'error-state',
}: Props) {
  return (
    <div
      role="alert"
      data-testid={testId}
      className="flex flex-col items-center gap-4 py-12 px-6 text-center"
    >
      {/* Danger icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full shrink-0"
        style={{
          backgroundColor: 'rgba(239,68,68,0.10)',
          border: '1px solid rgba(239,68,68,0.20)',
        }}
        aria-hidden="true"
      >
        <svg
          width={28}
          height={28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f87171"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Cause */}
      <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
        {message}
      </p>

      {/* Retry affordance */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          data-testid="error-state-retry-btn"
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          style={{
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.30)',
            color: '#f87171',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.14)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)';
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
