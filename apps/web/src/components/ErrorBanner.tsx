/**
 * ErrorBanner — red-tinted alert banner for form-level errors.
 */

type Props = { message: string };

export function ErrorBanner({ message }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md p-3 text-sm"
      style={{
        backgroundColor: 'rgba(239,68,68,0.10)',
        border: '1px solid rgba(239,68,68,0.20)',
        color: '#ef4444',
      }}
    >
      <span aria-hidden="true" className="shrink-0 mt-0.5">
        ⚠
      </span>
      <span>{message}</span>
    </div>
  );
}
