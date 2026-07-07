/**
 * MemberProfileCard — read-only floating card rendering a member's self-declared
 * academic identity. Opened from MemberListPanel by clicking a member row.
 *
 * Design: design/member-profile-card.html (D-3 ADOPTED, wave-77 M13 leg-2).
 *   Ported to React with the bundled Tailwind pipeline (NO CDN), real DS tokens,
 *   and inline-SVG icons from ./icons (NO Phosphor CDN webfont).
 *
 * Four states (per the adopted design):
 *   - loading  → shimmer skeleton, aria-busy on the card
 *   - loaded   → full identity stack (only the fields the member declared)
 *   - partial  → same body; absent fields simply omitted (component shrinks)
 *   - hidden   → calm "Profile Unavailable" state. Reached on the API's uniform
 *                404 (getPublicProfile → HttpError status 404) — NOT an error.
 *
 * D-3 port obligations honoured:
 *   - createPortal(document.body) + viewport edge-clamp (BUILD-14: never let a
 *     transformed ancestor — the shell uses transforms — clip this floating card).
 *   - Icons from ./icons inline-SVG (GraduationCapIcon / BooksIcon / UsersIcon /
 *     ClockIcon / UserIcon / EyeSlashIcon). No CDN webfont.
 *   - aria-busy on the loading skeleton.
 *   - Presence dot is non-color-only: it carries a visible ring + an aria-label.
 *   - Esc dismisses = UNMOUNT (onClose) + restore focus to the trigger (not a
 *     fade-in-place). Outside-click also dismisses.
 *   - No verification badge: academicRole renders as PLAIN TEXT (self-declared
 *     fence). Read-only card (no edit affordance). Email is never rendered
 *     (PublicProfile carries none).
 *
 * BUILD-13: userId is an opaque UUID threaded straight to getPublicProfile.
 */

import type { AcademicRole, PublicProfile } from '@studyhall/shared';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HttpError, api } from '../auth/api';
import {
  BooksIcon,
  ClockIcon,
  EyeSlashIcon,
  GraduationCapIcon,
  UserIcon,
  UsersIcon,
  WarningIcon,
} from './icons';

const CARD_WIDTH = 320; // w-80
const VIEWPORT_MARGIN = 8; // edge-clamp gutter

type FetchState =
  | { kind: 'loading' }
  | { kind: 'loaded'; profile: PublicProfile }
  | { kind: 'hidden' }
  // Client-observable transport failure (network / timeout / 5xx). DISTINCT from
  // 'hidden': this reads as "couldn't load — try again" and offers a retry.
  // Derived ONLY from the HTTP status / transport outcome — no server signal of
  // WHY a profile is hidden (a 404 is always the uniform 'hidden' anti-oracle).
  | { kind: 'error' };

type Props = {
  /** Opaque target UUID (BUILD-13). */
  userId: string;
  /** Presence status for the dot; 'online' | 'idle' | 'offline'. */
  presence?: 'online' | 'idle' | 'offline';
  /** Anchor rect of the trigger row (for positioning + edge-clamp). */
  anchorRect: DOMRect | null;
  /** Called to unmount the card (Esc / outside-click / re-click). */
  onClose: () => void;
  /** Trigger element to restore focus to on dismiss. */
  triggerRef: React.RefObject<HTMLElement | null>;
};

/** Map academic-role literal → the label shown as PLAIN TEXT (no trust badge). */
const ROLE_LABELS: Record<AcademicRole, string> = {
  student: 'Student',
  educator: 'Educator',
  staff: 'Staff',
};

function roleLabel(role: AcademicRole | null): string | null {
  return role ? ROLE_LABELS[role] : null;
}

/** Up-to-2-char uppercase initials for the avatar fallback. */
function getInitials(displayName: string | null, username: string | null): string {
  const name = (displayName ?? username ?? '').trim();
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

// ── Presence dot — non-color-only (visible ring) + aria-label ────────────────

const PRESENCE_COLOR: Record<NonNullable<Props['presence']>, string> = {
  online: '#10b981',
  idle: '#f59e0b',
  offline: '#52525b',
};

const PRESENCE_LABEL: Record<NonNullable<Props['presence']>, string> = {
  online: 'Online',
  idle: 'Idle',
  offline: 'Offline',
};

function PresenceDot({ presence }: { presence: NonNullable<Props['presence']> }) {
  return (
    <div
      className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full"
      style={{ backgroundColor: '#121214' }}
      role="img"
      aria-label={PRESENCE_LABEL[presence]}
      data-testid="member-card-presence"
    >
      <div
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: PRESENCE_COLOR[presence] }}
      />
    </div>
  );
}

// ── One academic field row (icon + label + value); omitted when value absent ──

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-[3px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
        {icon}
      </div>
      <div className="flex flex-1 flex-col">
        <span
          className="mb-1 text-xs font-semibold uppercase leading-none tracking-wider"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          {label}
        </span>
        <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Shimmer skeleton row ─────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex gap-3">
      <div className="h-4 w-4 shrink-0 rounded-sm" style={{ backgroundColor: '#27272a' }} />
      <div className="flex flex-1 flex-col gap-1.5 pt-1">
        <div className="h-2 w-1/3 rounded-sm" style={{ backgroundColor: '#27272a' }} />
        <div className="h-3 w-4/5 rounded-sm" style={{ backgroundColor: '#27272a' }} />
      </div>
    </div>
  );
}

export function MemberProfileCard({
  userId,
  presence = 'offline',
  anchorRect,
  onClose,
  triggerRef,
}: Props) {
  const [state, setState] = useState<FetchState>({ kind: 'loading' });
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Retry counter — bumping it re-runs the fetch effect (which owns the single
  // cancellation path), so a manual retry reuses the exact same load + cleanup.
  const [attempt, setAttempt] = useState(0);
  const handleRetry = useCallback(() => setAttempt((n) => n + 1), []);

  // Fetch the public profile. The catch branches CLIENT-SIDE on the error:
  //   - HttpError status 404 → the uniform 'hidden' anti-oracle (wave-77). This
  //     is byte-identical across every non-visible cause (hidden / blocked /
  //     soft-deleted / nonexistent) so a probing stranger cannot learn WHY.
  //   - anything else (network throw, timeout, or a 5xx HttpError) → 'error', a
  //     DISTINCT retryable state. A 5xx is transport-failure, NOT hidden.
  //   - 401 keeps existing behaviour (falls through to the retryable state; the
  //     card is only opened from an authed shell, so a 401 here is transport-ish).
  // No new server field: the distinction is derived only from status/transport.
  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    api
      .getPublicProfile(userId)
      .then((profile) => {
        if (!cancelled) setState({ kind: 'loaded', profile });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof HttpError && err.status === 404) {
          setState({ kind: 'hidden' });
        } else {
          setState({ kind: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  // Position + edge-clamp against the viewport. Runs before paint and re-clamps
  // once the real card height is known (so tall/short bodies both stay on-screen).
  // biome-ignore lint/correctness/useExhaustiveDependencies: `state` is a deliberate dep — the card height changes between loading/loaded/hidden bodies, so we must re-clamp against the freshly-measured height on each state transition.
  useLayoutEffect(() => {
    if (!anchorRect) {
      // Centre fallback when no anchor is supplied.
      setPos({
        top: Math.max(VIEWPORT_MARGIN, window.innerHeight / 2 - 160),
        left: Math.max(VIEWPORT_MARGIN, window.innerWidth / 2 - CARD_WIDTH / 2),
      });
      return;
    }
    const cardH = cardRef.current?.offsetHeight ?? 300;
    // Prefer opening to the LEFT of the roster row (roster is on the right edge).
    let left = anchorRect.left - CARD_WIDTH - 8;
    if (left < VIEWPORT_MARGIN) left = anchorRect.right + 8; // flip to the right
    left = Math.min(
      Math.max(VIEWPORT_MARGIN, left),
      window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN,
    );

    let top = anchorRect.top;
    top = Math.min(Math.max(VIEWPORT_MARGIN, top), window.innerHeight - cardH - VIEWPORT_MARGIN);
    setPos({ top, left });
  }, [anchorRect, state]);

  // Esc → unmount + restore focus. Outside-click → unmount + restore focus.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        triggerRef.current?.focus();
      }
    }
    function handleClick(e: MouseEvent) {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose, triggerRef]);

  // Focus the card on mount (dialog affordance).
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 120,
    width: CARD_WIDTH,
    top: pos?.top ?? -9999,
    left: pos?.left ?? -9999,
    backgroundColor: '#121214',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    // Hide until positioned to avoid a flash at the fallback offset.
    visibility: pos ? 'visible' : 'hidden',
  };

  const ariaLabel =
    state.kind === 'loading'
      ? 'Loading profile'
      : state.kind === 'hidden'
        ? 'Profile Unavailable'
        : state.kind === 'error'
          ? "Couldn't load profile"
          : `Member profile: ${state.profile.displayName ?? state.profile.username ?? 'member'}`;

  return createPortal(
    <div
      ref={cardRef}
      role="dialog"
      aria-label={ariaLabel}
      aria-busy={state.kind === 'loading'}
      tabIndex={-1}
      data-testid="member-profile-card"
      className="flex flex-col overflow-hidden focus:outline-none"
      style={style}
    >
      {/* ── LOADING skeleton ─────────────────────────────────────────────── */}
      {state.kind === 'loading' && (
        <>
          <div
            className="relative h-[60px]"
            style={{ backgroundColor: '#27272a' }}
            aria-hidden="true"
          />
          <div className="absolute left-5 top-5">
            <div
              className="h-16 w-16 rounded-full"
              style={{ backgroundColor: '#27272a', boxShadow: '0 0 0 4px #121214' }}
            />
          </div>
          <div className="flex flex-col px-6 pb-6 pt-[58px] text-left">
            <div className="mb-6 flex flex-col gap-2">
              <div className="h-5 w-3/5 rounded-md" style={{ backgroundColor: '#27272a' }} />
              <div className="h-3 w-1/4 rounded-sm" style={{ backgroundColor: '#27272a' }} />
            </div>
            <div className="flex flex-col gap-4">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
        </>
      )}

      {/* ── HIDDEN — calm "Profile Unavailable" ──────────────────────────── */}
      {state.kind === 'hidden' && (
        <>
          <div
            className="relative h-[60px]"
            style={{ backgroundColor: '#1c1c1f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            aria-hidden="true"
          />
          <div className="absolute left-5 top-5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.40)',
                boxShadow: '0 0 0 4px #121214',
              }}
            >
              <UserIcon size={28} />
            </div>
          </div>
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 pb-8 pt-[64px] text-center">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'rgba(63,63,70,0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.40)',
              }}
            >
              <EyeSlashIcon size={20} />
            </div>
            <h4
              className="mb-1 text-[15px] font-medium"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Profile Unavailable
            </h4>
            <p className="px-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
              This member&apos;s academic identity is hidden due to visibility settings.
            </p>
          </div>
        </>
      )}

      {/* ── ERROR — transport failure (network / timeout / 5xx): retryable ─── */}
      {/* DISTINCT from 'hidden': reads "couldn't load — try again", offers a    */}
      {/* retry. Reuses the same container + DS tokens as the hidden state — a   */}
      {/* copy/affordance variant, no new design surface.                        */}
      {state.kind === 'error' && (
        <>
          <div
            className="relative h-[60px]"
            style={{ backgroundColor: '#1c1c1f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            aria-hidden="true"
          />
          <div className="absolute left-5 top-5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.40)',
                boxShadow: '0 0 0 4px #121214',
              }}
            >
              <UserIcon size={28} />
            </div>
          </div>
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 pb-8 pt-[64px] text-center">
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
              style={{
                // Amber alert accent (DESIGN-SYSTEM.md: warning/reconnecting) —
                // a recoverable "try again", not the danger-red of a hard error.
                backgroundColor: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#f59e0b',
              }}
            >
              <WarningIcon size={20} />
            </div>
            <h4
              className="mb-1 text-[15px] font-medium"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Couldn&apos;t load profile
            </h4>
            <p
              className="mb-4 px-2 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Something went wrong reaching this profile. Check your connection and try again.
            </p>
            {/* DS Button — secondary variant (surface-700 fill + hairline border,
                radius-md, sm). A real <button> with a focus-visible ring. */}
            <button
              type="button"
              onClick={handleRetry}
              data-testid="member-card-retry"
              className="h-8 rounded-md px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: '#27272a',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              Try again
            </button>
          </div>
        </>
      )}

      {/* ── LOADED / PARTIAL — identity stack ────────────────────────────── */}
      {state.kind === 'loaded' && <LoadedBody profile={state.profile} presence={presence} />}
    </div>,
    document.body,
  );
}

function LoadedBody({
  profile,
  presence,
}: {
  profile: PublicProfile;
  presence: NonNullable<Props['presence']>;
}) {
  const initials = getInitials(profile.displayName, profile.username);
  const displayName = profile.displayName ?? profile.username ?? 'Member';

  return (
    <>
      {/* Neutral banner */}
      <div
        className="relative h-[60px]"
        style={{ backgroundColor: '#1c1c1f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        aria-hidden="true"
      />

      {/* Avatar + presence dot */}
      <div className="absolute left-5 top-5">
        <div className="relative rounded-full" style={{ boxShadow: '0 0 0 4px #121214' }}>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={`${displayName}'s avatar`}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold"
              style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
              aria-label={displayName}
            >
              {initials}
            </div>
          )}
          <PresenceDot presence={presence} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col px-6 pb-6 pt-[52px] text-left">
        {/* Core identity */}
        <div className="mb-4 flex flex-col">
          <h3
            className="text-xl font-medium leading-tight tracking-[-0.01em]"
            style={{ color: 'rgba(255,255,255,0.92)' }}
            data-testid="member-card-name"
          >
            {displayName}
          </h3>
          {profile.pronouns && (
            <span className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {profile.pronouns}
            </span>
          )}
        </div>

        {/* Open bio */}
        {profile.bio && (
          <p className="mb-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {profile.bio}
          </p>
        )}

        {/* Academic data stack — each row omitted when its value is absent */}
        <div className="flex flex-col gap-3">
          <FieldRow
            icon={<GraduationCapIcon size={15} />}
            label="Institution"
            value={profile.institution}
          />
          <FieldRow
            icon={<BooksIcon size={15} />}
            label="Program / Field"
            value={profile.program}
          />
          {/* Academic role — PLAIN TEXT, no verification/trust badge. */}
          <FieldRow
            icon={<UsersIcon size={15} />}
            label="Academic Role"
            value={roleLabel(profile.academicRole)}
          />
          <FieldRow
            icon={<ClockIcon size={15} />}
            label="Academic Year"
            value={profile.academicYear}
          />
        </div>
      </div>
    </>
  );
}
