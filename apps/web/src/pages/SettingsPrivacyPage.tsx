/**
 * SettingsPrivacyPage — /settings/privacy
 *
 * BOARD/P-4 binding constraints applied here:
 *
 *  1. Profile-visibility is an HONEST 2-option control, not 3.
 *     "Visible to classmates" maps to enum `everyone`.
 *     "Hidden"               maps to enum `nobody`.
 *     The `server-members` enum value is valid server-side and is preserved
 *     on round-trips where the server returns it (mapped to "Visible to
 *     classmates" in the UI) but is NOT surfaced as a distinct user choice
 *     today because `everyone` and `server-members` behave identically on
 *     every current surface (member roster). Presenting both as separate
 *     choices would be privacy-theater.
 *
 *  2. Who-can-DM is rendered as a DISABLED affordance only.
 *     The value is persisted server-side but no DM surface exists yet to
 *     enforce it. The control must not look interactive.
 *
 *  3. Account-data section (sibling a4169fac): read-only display from
 *     GET /profile/data + "Download my data" button (blob download, no modal).
 *
 *  4. Loading state uses skeleton rows (DESIGN-SYSTEM §113), NOT a spinner.
 *     Error state shows ErrorBanner + retry button.
 */

import type { AccountDataResponse, PrivacySettingsResponse } from '@studyhall/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../auth/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { BlockedUsersPanel } from '../shell/BlockedUsersPanel';
import { DangerZonePanel } from '../shell/DangerZonePanel';
import { PrivacyActivityPanel } from '../shell/PrivacyActivityPanel';

// ── Static option tables (defined outside component — no deps) ────────────────

const VISIBILITY_OPTIONS = [
  {
    value: 'everyone' as const,
    label: 'Visible to classmates',
    desc: "Members of servers you've joined can see your profile card.",
  },
  {
    value: 'nobody' as const,
    label: 'Hidden',
    desc: 'Your profile card is hidden from all member lists.',
  },
] as const;

const DM_OPTIONS = [
  { value: 'everyone' as const, label: 'Anyone in my servers' },
  { value: 'server-members' as const, label: 'Classmates only' },
  { value: 'nobody' as const, label: 'No one' },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps the server-side 3-value enum → the honest 2-option UI value.
 * `server-members` is absorbed into `everyone` (they behave identically).
 */
export function toUiVisibility(
  v: PrivacySettingsResponse['profileVisibility'],
): 'everyone' | 'nobody' {
  return v === 'nobody' ? 'nobody' : 'everyone';
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ── Skeleton (DESIGN-SYSTEM §113 — shimmer rows, not spinner) ─────────────────

function SkeletonBlock({
  width = '100%',
  height = 16,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      className="sh-animate-pulse rounded"
      style={{ width, height, backgroundColor: '#27272a' }}
    />
  );
}

function PrivacyPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {([0, 1, 2] as const).map((i) => (
        <div
          key={i}
          className="rounded-lg p-6"
          style={{
            backgroundColor: '#1c1c1f',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <SkeletonBlock width={200} height={20} />
          <div className="mt-2 mb-5">
            <SkeletonBlock height={13} />
          </div>
          <div className="flex flex-col gap-3">
            <SkeletonBlock height={66} />
            <SkeletonBlock height={66} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SettingsPrivacyPage() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState<PrivacySettingsResponse | null>(null);
  const [accountData, setAccountData] = useState<AccountDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── Visibility save state ─────────────────────────────────────────────────
  const [uiVisibility, setUiVisibility] = useState<'everyone' | 'nobody'>('everyone');
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilityError, setVisibilityError] = useState('');
  const [visibilitySaveSuccess, setVisibilitySaveSuccess] = useState(false);

  // ── Presence save state (LIVE feature — real working toggle) ───────────────
  const [showPresence, setShowPresence] = useState(true);
  const [presenceSaving, setPresenceSaving] = useState(false);
  const [presenceError, setPresenceError] = useState('');
  const [presenceSaveSuccess, setPresenceSaveSuccess] = useState(false);

  // ── Export state ──────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // ── Load (shared between initial mount and retry button) ──────────────────
  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');

    Promise.all([api.getPrivacy(), api.getAccountData()])
      .then(([priv, data]) => {
        setPrivacy(priv);
        setUiVisibility(toUiVisibility(priv.profileVisibility));
        setShowPresence(priv.showPresence);
        setAccountData(data);
      })
      .catch(() => setLoadError('Could not load your privacy settings. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Visibility change (auto-saves on radio select, like accent colour) ─────
  async function handleVisibilityChange(value: 'everyone' | 'nobody') {
    if (visibilitySaving) return;

    // Optimistic UI update
    setUiVisibility(value);
    setVisibilityError('');
    setVisibilitySaveSuccess(false);
    setVisibilitySaving(true);

    try {
      // UpdatePrivacySchema is full-replace: send ALL three fields. Preserve the
      // other two from current settings state, changing only profileVisibility.
      const updated = await api.putPrivacy({
        profileVisibility: value,
        whoCanDm: privacy?.whoCanDm ?? 'everyone',
        showPresence: privacy?.showPresence ?? showPresence,
      });
      setPrivacy(updated);
      setUiVisibility(toUiVisibility(updated.profileVisibility));
      setShowPresence(updated.showPresence);
      setVisibilitySaveSuccess(true);
      setTimeout(() => setVisibilitySaveSuccess(false), 3000);
    } catch {
      setVisibilityError('Could not save visibility setting. Please try again.');
      // Revert optimistic update to the last known server value
      if (privacy) setUiVisibility(toUiVisibility(privacy.profileVisibility));
    } finally {
      setVisibilitySaving(false);
    }
  }

  // ── Presence change (auto-saves on toggle, mirrors visibility save) ────────
  async function handlePresenceChange(value: boolean) {
    if (presenceSaving) return;

    // Optimistic UI update
    setShowPresence(value);
    setPresenceError('');
    setPresenceSaveSuccess(false);
    setPresenceSaving(true);

    try {
      // Full-replace PUT: send ALL three fields. Preserve the other two from
      // current settings state, changing only showPresence.
      const updated = await api.putPrivacy({
        profileVisibility: privacy?.profileVisibility ?? 'everyone',
        whoCanDm: privacy?.whoCanDm ?? 'everyone',
        showPresence: value,
      });
      setPrivacy(updated);
      setShowPresence(updated.showPresence);
      setUiVisibility(toUiVisibility(updated.profileVisibility));
      setPresenceSaveSuccess(true);
      setTimeout(() => setPresenceSaveSuccess(false), 3000);
    } catch {
      setPresenceError('Could not save your online status setting. Please try again.');
      // Revert optimistic update to the last known server value
      if (privacy) setShowPresence(privacy.showPresence);
    } finally {
      setPresenceSaving(false);
    }
  }

  // ── Data export ───────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      await api.exportAccountData();
    } catch {
      setExportError('Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0a0a0b', color: 'rgba(255,255,255,0.92)' }}
    >
      {/* Page header — matches ProfilePage structure */}
      <header
        className="flex h-14 items-center border-b px-6"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <h1 className="text-base font-semibold">Settings — Privacy</h1>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Section heading */}
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
            Privacy Settings
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Your data is yours. StudyHall doesn&apos;t track you for ads or sell your data. We give
            you full control over what you share and who can interact with you.
          </p>
        </div>

        {/* ── Loading state — skeleton rows ─────────────────────────────────── */}
        {loading && <PrivacyPageSkeleton />}

        {/* ── Error state — banner + retry ──────────────────────────────────── */}
        {!loading && loadError && (
          <div className="flex flex-col items-start gap-4">
            <ErrorBanner message={loadError} />
            <button
              type="button"
              onClick={load}
              className="rounded-md px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none"
              style={{
                backgroundColor: '#27272a',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Content — visible once loaded without error ────────────────────── */}
        {!loading && !loadError && (
          <div className="flex flex-col gap-6">
            {/* ── Panel 1: Profile Visibility ───────────────────────────────── */}
            <section
              className="rounded-lg p-6"
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              <h3 id="visibility-heading" className="mb-1 text-[17px] font-semibold text-white">
                Who can see your profile?
              </h3>
              <p className="mb-5 text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Your profile card (avatar, display name) is shown in member lists. Control who can
                find you across StudyHall.
              </p>

              {visibilityError && (
                <div className="mb-4">
                  <ErrorBanner message={visibilityError} />
                </div>
              )}

              {visibilitySaveSuccess && (
                <p
                  role="status"
                  className="mb-4 rounded-md px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.10)',
                    border: '1px solid rgba(16,185,129,0.20)',
                    color: '#10b981',
                  }}
                >
                  ✓ Visibility saved.
                </p>
              )}

              <div
                role="radiogroup"
                aria-labelledby="visibility-heading"
                className="flex flex-col gap-3"
              >
                {VISIBILITY_OPTIONS.map(({ value, label, desc }) => {
                  const isChecked = uiVisibility === value;
                  return (
                    <label
                      key={value}
                      className="flex cursor-pointer gap-3 rounded-md p-4 transition-colors"
                      style={{
                        border: isChecked
                          ? '1px solid rgba(16,185,129,0.30)'
                          : '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: isChecked ? 'rgba(16,185,129,0.04)' : '#121214',
                        opacity: visibilitySaving ? 0.65 : 1,
                        pointerEvents: visibilitySaving ? 'none' : undefined,
                        transition: 'border-color 150ms ease, background-color 150ms ease',
                      }}
                    >
                      {/* Real radio input — accessible, visually hidden */}
                      <input
                        type="radio"
                        name="profile-visibility"
                        value={value}
                        checked={isChecked}
                        onChange={() => handleVisibilityChange(value)}
                        disabled={visibilitySaving}
                        className="sr-only"
                      />

                      {/* Custom visual radio dot */}
                      <div
                        aria-hidden="true"
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{
                          border: isChecked ? '2px solid #10b981' : '2px solid #52525b',
                          transition: 'border-color 150ms ease',
                        }}
                      >
                        {isChecked && (
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: '#10b981' }}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1">
                        <div
                          className="mb-0.5 text-sm font-semibold"
                          style={{
                            color: isChecked ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.60)',
                            transition: 'color 150ms ease',
                          }}
                        >
                          {label}
                        </div>
                        <div
                          className="text-[13px] leading-snug"
                          style={{ color: 'rgba(255,255,255,0.40)' }}
                        >
                          {desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <p
                className="mt-4 pt-4 text-[12px] leading-relaxed"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.40)',
                }}
              >
                When set to Hidden, your profile is removed from the member list for everyone in the
                server — including organizers and owners.
              </p>
            </section>

            {/* ── Panel 2: Online status — LIVE working toggle ──────────────── */}
            {/*
              Presence is a live feature (honored server-side). This is a REAL
              working control — enabled, auto-saved, PUT→GET round-trip — modelled
              on the profileVisibility panel above, NOT the disabled DM affordance.
            */}
            <section
              className="rounded-lg p-6"
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              <h3 id="presence-heading" className="mb-1 text-[17px] font-semibold text-white">
                Show my online status
              </h3>
              <p className="mb-5 text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                When on, classmates can see when you&apos;re online. Turn it off to appear offline
                to everyone.
              </p>

              {presenceError && (
                <div className="mb-4">
                  <ErrorBanner message={presenceError} />
                </div>
              )}

              {presenceSaveSuccess && (
                <p
                  role="status"
                  className="mb-4 rounded-md px-3 py-2 text-sm"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.10)',
                    border: '1px solid rgba(16,185,129,0.20)',
                    color: '#10b981',
                  }}
                >
                  ✓ Online status saved.
                </p>
              )}

              <div
                className="flex items-center justify-between gap-4 rounded-md p-4"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: '#121214',
                }}
              >
                <div className="flex-1">
                  <div
                    className="mb-0.5 text-sm font-semibold"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    Show when I&apos;m online to others
                  </div>
                  <div
                    className="text-[13px] leading-snug"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    {showPresence
                      ? 'Classmates can see when you’re online.'
                      : 'You’ll appear offline to everyone.'}
                  </div>
                </div>

                {/* Real switch — accessible, enabled, emerald when on (DESIGN-SYSTEM) */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showPresence}
                  aria-labelledby="presence-heading"
                  disabled={presenceSaving}
                  onClick={() => handlePresenceChange(!showPresence)}
                  className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none"
                  style={{
                    backgroundColor: showPresence ? '#10b981' : '#52525b',
                    opacity: presenceSaving ? 0.65 : 1,
                    cursor: presenceSaving ? 'default' : 'pointer',
                    transition: 'background-color 150ms ease',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-5 w-5 rounded-full"
                    style={{
                      backgroundColor: '#fff',
                      transform: showPresence ? 'translateX(22px)' : 'translateX(2px)',
                      transition: 'transform 150ms ease',
                    }}
                  />
                </button>
              </div>
            </section>

            {/* ── Panel 3: Who can message you — DISABLED affordance ────────── */}
            {/*
              BOARD binding: NOT an active control. whoCanDm is persisted server-side
              but there is no DM enforcement surface today. This panel must look
              clearly inactive — the instructions require it NOT to look like a
              working toggle.
            */}
            <section
              className="rounded-lg p-6"
              style={{
                backgroundColor: '#121214',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                opacity: 0.65,
              }}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-semibold text-white">Who can message you?</h3>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: '#27272a',
                    color: 'rgba(255,255,255,0.40)',
                  }}
                >
                  Beta Feature
                </span>
              </div>
              <p className="mb-4 text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Direct messaging is rolling out soon. Your preference will be saved and enforced
                once the feature is available.
              </p>

              {/* Disabled affordance — no pointer events, no interactivity */}
              <div
                aria-disabled="true"
                className="flex select-none flex-col gap-2"
                style={{ pointerEvents: 'none', opacity: 0.55 }}
              >
                {DM_OPTIONS.map(({ value, label }) => {
                  const isCurrent = privacy?.whoCanDm === value;
                  return (
                    <div
                      key={value}
                      className="flex items-center gap-3 rounded-md p-3"
                      style={{
                        border: '1px solid rgba(255,255,255,0.06)',
                        backgroundColor: '#1c1c1f',
                      }}
                    >
                      <div
                        aria-hidden="true"
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ border: '2px solid #52525b' }}
                      >
                        {isCurrent && (
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: '#52525b' }}
                          />
                        )}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'rgba(255,255,255,0.60)' }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-[12px] italic" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Takes effect when direct messages arrive.
              </p>
            </section>

            {/* ── Panel 3: Blocked users ────────────────────────────────────── */}
            <BlockedUsersPanel />

            {/* ── Panel 4: Account data (sibling a4169fac) ─────────────────── */}
            {/* (Panel 5: Danger Zone rendered below) */}
            <section
              className="rounded-lg p-6"
              style={{
                backgroundColor: '#1c1c1f',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header row: title + download button */}
              <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="mb-1 text-[17px] font-semibold text-white">Your data</h3>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    Personal data held by StudyHall. Review it below or download a copy.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    aria-busy={exporting}
                    className="rounded-md px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none"
                    style={{ backgroundColor: '#10b981', color: '#fff' }}
                  >
                    {exporting ? 'Preparing…' : 'Download my data'}
                  </button>
                  {exportError && (
                    <p role="alert" className="text-[12px]" style={{ color: '#ef4444' }}>
                      {exportError}
                    </p>
                  )}
                </div>
              </div>

              {/* Account data display */}
              {accountData && (
                <div className="flex flex-col gap-5">
                  {/* Profile fields */}
                  <div>
                    <h4
                      className="mb-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      Profile information
                    </h4>
                    <dl className="flex flex-col gap-2">
                      {(
                        [
                          ['Display name', accountData.profile.displayName ?? '—'],
                          [
                            'Username',
                            accountData.profile.username ? `@${accountData.profile.username}` : '—',
                          ],
                          ['Email', accountData.profile.email],
                        ] as [string, string][]
                      ).map(([key, val]) => (
                        <div key={key} className="flex items-baseline gap-2">
                          <dt
                            className="w-28 shrink-0 text-[12px]"
                            style={{ color: 'rgba(255,255,255,0.40)' }}
                          >
                            {key}
                          </dt>
                          <dd className="text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
                            {val}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                  {/* Membership summary */}
                  <div>
                    <h4
                      className="mb-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      Membership summary
                    </h4>
                    {accountData.memberships.length === 0 ? (
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        Not a member of any servers yet.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {accountData.memberships.map((m) => (
                          <li
                            key={m.serverId}
                            className="flex items-center justify-between text-sm"
                          >
                            <span style={{ color: 'rgba(255,255,255,0.92)' }}>{m.serverName}</span>
                            <span
                              className="text-[12px]"
                              style={{ color: 'rgba(255,255,255,0.40)' }}
                            >
                              Joined {formatDate(m.joinedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                  {/* Activity summary */}
                  <div>
                    <h4
                      className="mb-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      Activity summary
                    </h4>
                    <dl className="flex flex-col gap-2">
                      {(
                        [
                          ['Servers joined', String(accountData.activitySummary.serversJoined)],
                          [
                            'Account created',
                            formatDate(accountData.activitySummary.accountCreatedAt),
                          ],
                        ] as [string, string][]
                      ).map(([key, val]) => (
                        <div key={key} className="flex items-baseline gap-2">
                          <dt
                            className="w-28 shrink-0 text-[12px]"
                            style={{ color: 'rgba(255,255,255,0.40)' }}
                          >
                            {key}
                          </dt>
                          <dd className="text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
                            {val}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
            </section>

            {/* ── Panel 5: Privacy activity ─────────────────────────────────── */}
            <PrivacyActivityPanel />

            {/* ── Panel 6: Danger Zone ──────────────────────────────────────── */}
            <DangerZonePanel />
          </div>
        )}
      </main>
    </div>
  );
}
