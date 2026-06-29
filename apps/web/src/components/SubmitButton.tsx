/**
 * SubmitButton — emerald primary button with loading state.
 * Design system §8 Button primitive (primary variant, lg size).
 */

import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: React.ReactNode;
};

export function SubmitButton({ loading, children, disabled, ...rest }: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={loading ? true : undefined}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: isDisabled ? '#3f3f46' : '#10b981',
        color: isDisabled ? 'rgba(255,255,255,0.40)' : '#0a0a0b',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : '0 4px 14px 0 rgba(16,185,129,0.30)',
      }}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent sh-animate-spin"
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  );
}
