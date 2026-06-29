/**
 * FormField — label + input + optional error message.
 * Design system §8 Input primitive.
 */

import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string | undefined;
};

export function FormField({ id, label, error, className: _c, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[13px] font-medium"
        style={{ color: 'rgba(255,255,255,0.60)' }}
      >
        {label}
      </label>
      <input
        id={id}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className="h-10 w-full rounded-md px-3 text-sm outline-none transition-all duration-200 placeholder:opacity-40"
        style={{
          backgroundColor: '#0a0a0b',
          border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.92)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#10b981';
          e.currentTarget.style.boxShadow = error
            ? '0 0 0 2px rgba(239,68,68,0.2)'
            : '0 0 0 2px rgba(16,185,129,0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  );
}
