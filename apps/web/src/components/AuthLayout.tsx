/**
 * AuthLayout — centred card used by login, signup, forgot-password,
 * reset-password, and email-verify pages.
 *
 * Renders the ambient grid background, a subtle emerald glow, and a
 * glass-panel card matching the design mockups.
 */

import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: '#0a0a0b', color: 'rgba(255,255,255,0.92)' }}
    >
      {/* Ambient grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Emerald ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-[10%] h-[400px] w-[600px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(16,185,129,0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo + heading */}
        <header className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: '#1c1c1f',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Books icon via inline SVG so no external dep needed */}
            <svg width="20" height="20" viewBox="0 0 256 256" aria-hidden="true" fill="#10b981">
              <path d="M231.65,194.55,198.46,36.75a16,16,0,0,0-19.10-12.29L132.87,34.76a16.08,16.08,0,0,0-11.85,14c-.36-.05-.72-.12-1.09-.12H72a16,16,0,0,0-16,16V228a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V148.12l42.94,89.88a16,16,0,0,0,21.21,7.46l43.36-20.71A16,16,0,0,0,231.65,194.55ZM120,228H72V64h48ZM176.89,49.09l13.6,28.5-30.27,14.44-13.6-28.5Zm-21.71,45.54,13.9,29.12-30.27,14.44-13.9-29.12Zm57.47,120.85L175.48,234l-14.23-29.79,30.27-14.44Zm-30.07-63L168.69,123l30.27-14.44,13.9,29.13Z" />
            </svg>
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {subtitle}
            </p>
          )}
        </header>

        {/* Glass card */}
        <main
          className="w-full rounded-2xl p-6 lg:p-8"
          style={{
            background: 'rgba(18,18,20,0.80)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 64px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
