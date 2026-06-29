/**
 * LandingPage — marketing homepage with CTAs to /signup and /login.
 * Mirrors the layout and copy from design/landing.html.
 */

import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0a0a0b', color: 'rgba(255,255,255,0.92)' }}
    >
      {/* ── Navbar ── */}
      <header
        className="fixed top-0 z-50 w-full"
        style={{
          backgroundColor: 'rgba(10,10,11,0.70)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: '#10b981' }}
            >
              <svg width="18" height="18" viewBox="0 0 256 256" fill="#0a0a0b" aria-hidden="true">
                <path d="M231.65,194.55,198.46,36.75a16,16,0,0,0-19.10-12.29L132.87,34.76a16.08,16.08,0,0,0-11.85,14c-.36-.05-.72-.12-1.09-.12H72a16,16,0,0,0-16,16V228a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V148.12l42.94,89.88a16,16,0,0,0,21.21,7.46l43.36-20.71A16,16,0,0,0,231.65,194.55ZM120,228H72V64h48ZM176.89,49.09l13.6,28.5-30.27,14.44-13.6-28.5Zm-21.71,45.54,13.9,29.12-30.27,14.44-13.9-29.12Zm57.47,120.85L175.48,234l-14.23-29.79,30.27-14.44Zm-30.07-63L168.69,123l30.27-14.44,13.9,29.13Z" />
              </svg>
            </div>
            <span className="hidden text-lg font-semibold tracking-tight sm:block">StudyHall</span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/login"
              className="hidden text-sm font-medium transition-colors duration-150 hover:opacity-90 sm:block"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Already a member? Sign in
            </Link>
            <Link
              to="/login"
              className="block text-sm font-medium transition-colors duration-150 hover:opacity-90 sm:hidden"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="flex h-9 items-center rounded-md px-4 text-sm font-semibold transition-all duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: '#10b981',
                color: '#0a0a0b',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              Create free account
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="flex min-h-screen items-center overflow-hidden pt-32 pb-16 relative">
          {/* Ambient background blob */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full"
            style={{
              background: 'rgba(16,185,129,0.08)',
              filter: 'blur(120px)',
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
            <div className="flex flex-col items-start gap-8 lg:max-w-xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: '#121214',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.60)',
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#10b981' }} />
                v1.0 is now available
              </div>

              <h1
                className="text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                The single
                <br />
                <span style={{ color: 'rgba(255,255,255,0.60)' }}>tool that</span>
                <br />
                replaces
                <br />
                Notion <span style={{ color: '#27272a' }}>+</span> Discord.
              </h1>

              <p
                className="max-w-md text-lg leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                Study over voice, track assignments, and stay connected —{' '}
                <strong className="font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  even when the internet isn&apos;t.
                </strong>{' '}
                Built for unreliable connectivity.
              </p>

              <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
                <Link
                  to="/signup"
                  className="flex h-12 w-full items-center justify-center rounded-md px-6 text-base font-semibold transition-all duration-150 hover:-translate-y-px active:translate-y-0 sm:w-auto focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    backgroundColor: '#10b981',
                    color: '#0a0a0b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}
                >
                  Get started for free
                </Link>
                <p
                  className="text-xs text-center sm:text-left"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  No credit card required.
                  <br />
                  Create a server in 30s.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Row: Offline sync ── */}
        <section
          className="mx-auto max-w-7xl border-t px-6 py-24"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2
              className="text-3xl font-semibold tracking-tight md:text-5xl"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Unreliable internet?{' '}
              <span style={{ color: 'rgba(255,255,255,0.60)' }}>Still works.</span>
            </h2>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Compose messages, read channels, and track assignments offline. Our sync engine
              handles the backlog when you reconnect.
            </p>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden py-40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #0a0a0b, #0d1512)' }}
          />
          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
            <h2
              className="mb-6 text-5xl font-semibold tracking-tighter md:text-6xl"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Start studying smarter.
            </h2>
            <p className="mb-10 max-w-xl text-xl" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Join thousands of students who have upgraded their workspace. Claim your free server
              in seconds.
            </p>
            <Link
              to="/signup"
              className="flex h-12 items-center rounded-md px-8 text-lg font-semibold transition-all duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: '#10b981',
                color: '#0a0a0b',
                boxShadow: '0 8px 20px -6px rgba(16,185,129,0.30)',
              }}
            >
              Get started for free
            </Link>
            <span
              className="mt-4 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              No Ads. No Data Brokers.
            </span>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t pt-12 pb-8"
        style={{ backgroundColor: '#080809', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">StudyHall</span>
            </div>
            <p
              className="max-w-[280px] text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Built for students. We don&apos;t track you for ads or sell your data.
            </p>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              &copy; 2024 StudyHall Inc.
            </span>
          </div>

          <div className="flex gap-8 text-sm">
            <div className="flex flex-col gap-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                Product
              </span>
              <Link
                to="/login"
                className="transition-colors hover:opacity-90"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
