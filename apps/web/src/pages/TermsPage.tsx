/**
 * TermsPage — static stub legal page at /terms.
 * Public (no auth required). Full ToS with moderation/billing terms deferred to H2 (feature 22).
 * Design tokens from DESIGN-SYSTEM.md § 1–2.
 */

import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div
      className="min-h-screen"
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Last updated: 2024
        </p>

        <div className="mt-8 space-y-8 text-base leading-relaxed" style={{ lineHeight: '1.5' }}>
          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Acceptance
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              By creating a StudyHall account or using the service, you agree to these Terms of
              Service. If you do not agree, do not use StudyHall.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Acceptable use
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              StudyHall is built for student study collaboration. You agree to use it only for
              lawful purposes and in ways that do not infringe the rights of others. You must not
              use StudyHall to distribute spam, malware, or illegal content, or to harass, bully, or
              harm other users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Account responsibilities
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              You are responsible for maintaining the confidentiality of your login credentials and
              for all activity that occurs under your account. Notify us immediately of any
              unauthorized use. Accounts may not be transferred without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Community conduct
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Study servers hosted on StudyHall are expected to maintain a respectful, focused
              academic environment. Server owners and moderators are responsible for enforcing
              community standards within their servers. StudyHall reserves the right to remove
              content or accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Termination
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              You may delete your account at any time. We reserve the right to suspend or terminate
              accounts that violate these terms, with or without prior notice, at our sole
              discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Limitation of liability
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              StudyHall is provided &ldquo;as is&rdquo; without warranty of any kind. To the maximum
              extent permitted by law, StudyHall Inc. is not liable for any indirect, incidental, or
              consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
              Contact
            </h2>
            <p className="mt-3" style={{ color: 'rgba(255,255,255,0.60)' }}>
              For questions about these terms, contact:{' '}
              <a
                href="mailto:legal@studyhall.app"
                className="transition-colors hover:opacity-90"
                style={{ color: '#10b981' }}
              >
                legal@studyhall.app
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
            This is a stub terms document for the self-use MVP stage. Full terms covering moderation
            policy, educator-tier terms, and paid-tier billing will be published before any external
            or paying users are onboarded.
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
            to="/privacy"
            className="transition-colors hover:opacity-90"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
