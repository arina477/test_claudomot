/**
 * PrivacyPage — static stub legal page at /privacy.
 * Public (no auth required). Full data-rights UI deferred to H2 (feature 24).
 * Design tokens from DESIGN-SYSTEM.md § 1–2.
 */

import { Link } from 'react-router-dom';
import { FullPageScroll } from '../shell/FullPageScroll';

export function PrivacyPage() {
  return (
    <FullPageScroll>
      <div
        className="min-h-dvh"
        style={{ backgroundColor: '#1c1c1f', color: 'rgba(255,255,255,0.92)' }}
      >
        {/* Nav bar */}
        <header
          className="border-b px-6 py-4"
          style={{ backgroundColor: '#121214', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <Link
              to="/"
              className="text-sm font-semibold transition-colors hover:opacity-90"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              StudyHall
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-3xl px-6 py-12">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ letterSpacing: '-0.01em', lineHeight: '1.25' }}
          >
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Last updated: 2026
          </p>

          <div className="mt-8 space-y-8 text-base leading-relaxed" style={{ lineHeight: '1.5' }}>
            <section>
              <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
                What we collect
              </h2>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
                StudyHall collects the information you provide when creating an account (email
                address, display name, and optional profile details), messages and content you send
                within study servers, and presence signals such as online/offline status within a
                server session.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
                How we use it
              </h2>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Your data is used solely to operate StudyHall — to deliver messages, show presence,
                power assignment tracking, and maintain your account. We do not sell your data to
                advertisers or data brokers. We do not use your study activity to build advertising
                profiles.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
                Storage and security
              </h2>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Data is stored on secured servers. Passwords are hashed and never stored in plain
                text. We use TLS for all data in transit. Access to production data is restricted to
                authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
                Your rights
              </h2>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
                You may request access to, correction of, or deletion of your personal data at any
                time by contacting us at the address below. Account deletion removes your profile
                and message history from active systems. Full data-rights tools (export, audit log,
                consent management) are planned for a future release.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
                Contact
              </h2>
              <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
                For privacy-related questions or data requests, contact:{' '}
                <a
                  href="mailto:privacy@studyhall.app"
                  className="transition-colors hover:opacity-90"
                  style={{ color: '#10b981' }}
                >
                  privacy@studyhall.app
                </a>
              </p>
            </section>

            <p
              className="border-t pt-8 text-sm"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.40)',
              }}
            >
              This is a stub policy for the self-use MVP stage. A full privacy policy covering
              FERPA/COPPA posture, data-rights flows, and export/delete tooling will be published
              before any school or partner onboarding.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer
          className="border-t px-6 py-8 text-sm"
          style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-6">
            <Link
              to="/"
              className="transition-colors hover:opacity-90"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Home
            </Link>
            <Link
              to="/terms"
              className="transition-colors hover:opacity-90"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </FullPageScroll>
  );
}
