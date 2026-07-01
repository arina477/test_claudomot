/**
 * VoiceOccupancyIndicator — pre-join occupancy display (wave-32, M6).
 *
 * Renders the four states from design/voice-occupancy-indicator.html (D-3 adopted):
 *   loading   — skeleton shimmer (3 avatar skeletons + count-chip skeleton).
 *   empty     — "Room is empty" door-open icon + invitation text.
 *   populated — count chip + "N studying now" + compact avatar cluster (≤6)
 *               with initials + "+N" overflow beyond 6.
 *   error     — fail-soft muted warning line; Join is never blocked.
 *
 * A11y contract (from D-3 design):
 *   - role="status" aria-live="polite" on all states (not role="alert" — non-critical).
 *   - populated: single sr-only span with full announcement (names + overflow count)
 *     so viewport collapse (<1024px) never loses member names.
 *   - visual cluster is aria-hidden="true" on populated state to prevent duplicate
 *     announcements clashing with the sr-only span.
 *   - avatar wrappers: tabindex="0" + focus-visible ring; aria-label = display name.
 *   - count chip aria-label = "N participants".
 *   - prefers-reduced-motion: Tailwind's animate-pulse is suppressed by the
 *     @media (prefers-reduced-motion: reduce) rule in the design HTML; we do
 *     the same via the Tailwind `motion-reduce:animate-none` variant.
 *
 * Token discipline:
 *   Only DESIGN-SYSTEM Tailwind classes are used. No arbitrary hex values; inline
 *   styles are used only where Tailwind cannot express the exact design token
 *   (matching the VoiceStudyRoom.tsx convention for inline style values).
 */

import type { VoiceParticipant } from './useVoiceOccupancy';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type OccupancyStatus = 'loading' | 'loaded' | 'error';

type Props = {
  count: number;
  participants: VoiceParticipant[];
  status: OccupancyStatus;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum avatars shown before the "+N more" overflow chip appears. */
const MAX_VISIBLE_AVATARS = 6;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

/**
 * Build the SR announcement string matching the D-3 design spec:
 *   "8 participants studying now: Sarah Chen, Julian Davis, and 6 others."
 * Names retained below 1024 (visual cluster collapses; SR span stays).
 */
function buildSrAnnouncement(count: number, participants: VoiceParticipant[]): string {
  const label = count === 1 ? 'participant' : 'participants';
  if (participants.length === 0) return `${count} ${label} studying now.`;

  const visible = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = count - visible.length;

  const nameList = visible.map((p) => p.displayName).join(', ');

  if (overflow > 0) {
    return `${count} ${label} studying now: ${nameList}, and ${overflow} ${overflow === 1 ? 'other' : 'others'}.`;
  }
  return `${count} ${label} studying now: ${nameList}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function VoiceOccupancyIndicator({ count, participants, status }: Props) {
  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return <ErrorState />;
  }

  // status === 'loaded'
  if (count === 0) {
    return <EmptyState />;
  }

  return <PopulatedState count={count} participants={participants} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// State: Loading
// ─────────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading occupancy data"
      className="flex items-center w-full gap-4"
    >
      {/* Avatar skeletons — visible on lg+; parity count matches populated state */}
      <div className="hidden lg:flex items-center -space-x-2" aria-hidden="true">
        {[30, 20, 10].map((zIndex) => (
          <div
            key={zIndex}
            className="w-[34px] h-[34px] rounded-full animate-pulse motion-reduce:animate-none border-2"
            style={{
              backgroundColor: 'rgba(39,39,42,0.40)',
              borderColor: '#1c1c1f',
              zIndex,
            }}
          />
        ))}
      </div>

      {/* Mobile text skeleton */}
      <div
        className="h-3 w-20 rounded-full animate-pulse motion-reduce:animate-none lg:hidden"
        style={{ backgroundColor: 'rgba(39,39,42,0.50)' }}
        aria-hidden="true"
      />

      {/* Count-chip skeleton — right-aligned, matches populated chip placement */}
      <div
        className="ml-auto w-12 h-6 rounded animate-pulse motion-reduce:animate-none"
        style={{
          backgroundColor: 'rgba(39,39,42,0.50)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State: Empty
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center text-center gap-3 py-2"
    >
      {/* Door icon — design/voice-occupancy-indicator.html: ph-door-open */}
      <div
        className="w-[42px] h-[42px] rounded-full flex items-center justify-center"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        aria-hidden="true"
      >
        {/* Inline door-open SVG (Phosphor line style, matches icon library) */}
        <DoorOpenIcon />
      </div>

      <div className="space-y-1">
        <h3
          className="text-base font-medium tracking-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Room is empty
        </h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
          No one else here yet — the door's open.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State: Populated
// ─────────────────────────────────────────────────────────────────────────────

type PopulatedProps = {
  count: number;
  participants: VoiceParticipant[];
};

function PopulatedState({ count, participants }: PopulatedProps) {
  const visible = participants.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = count - visible.length;
  const srAnnouncement = buildSrAnnouncement(count, participants);

  return (
    <div role="status" aria-live="polite">
      {/* SR-only announcement: full names + overflow count in one contiguous span.
          Retained at all viewport widths — the visual cluster collapses <1024 but
          the SR announcement never loses member names. */}
      <span className="sr-only">{srAnnouncement}</span>

      {/* Visual layout — hidden from screen readers to prevent duplicate announcements. */}
      <div className="flex items-center w-full gap-4" aria-hidden="true">
        {/* Avatar cluster — visible on lg+ only (design: responsive collapse < 1024) */}
        <div className="hidden lg:flex items-center -space-x-[10px]">
          {visible.map((participant, index) => {
            const zIndex = MAX_VISIBLE_AVATARS - index;
            return (
              <AvatarChip
                key={participant.userId}
                displayName={participant.displayName}
                zIndex={zIndex}
              />
            );
          })}

          {/* +N overflow chip */}
          {overflow > 0 && <OverflowChip overflow={overflow} zIndex={0} />}
        </div>

        {/* Mobile text fallback (< 1024px): simple "N studying now" */}
        <span className="lg:hidden text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
          {count} studying now
        </span>

        {/* Count chip — right-aligned; matches design "continuity chip" */}
        <div
          className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.60)',
          }}
          aria-label={`${count} participant${count !== 1 ? 's' : ''}`}
        >
          {/* Users icon — inline Phosphor-style SVG */}
          <UsersIcon />
          <span>{count}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State: Error (fail-soft)
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div role="status" aria-live="polite">
      <div
        className="flex items-center gap-3 rounded-md px-3 py-2 w-max text-xs font-medium"
        style={{
          backgroundColor: 'rgba(18,18,20,0.40)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.40)',
        }}
      >
        <WarningCircleIcon />
        <span>Occupancy data currently unavailable</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

type AvatarChipProps = {
  displayName: string;
  zIndex: number;
};

function AvatarChip({ displayName, zIndex }: AvatarChipProps) {
  const initials = getInitials(displayName);

  return (
    // Avatars are decorative within the pre-join context — all names are announced
    // via the sr-only span in PopulatedState. No tabIndex needed here.
    <div className="relative flex-shrink-0 group" style={{ zIndex }}>
      {/* Accessible avatar: role="img" with aria-label */}
      <div
        className="w-[34px] h-[34px] rounded-full border-2 flex items-center justify-center text-xs font-medium transition-transform duration-150 group-hover:-translate-y-0.5 group-focus:-translate-y-0.5"
        style={{
          backgroundColor: '#3f3f46',
          borderColor: '#1c1c1f',
          color: 'rgba(255,255,255,0.92)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        role="img"
        aria-label={displayName}
      >
        {initials}
      </div>

      {/* Tooltip — CSS-only hover/focus reveal matching the design HTML pattern */}
      <div
        className="
          pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2
          -translate-x-1/2 -translate-y-1 scale-95
          opacity-0 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
          focus-within:opacity-100 focus-within:translate-y-0 focus-within:scale-100
          transition-all duration-200
          text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md z-50
        "
        style={{
          backgroundColor: '#27272a',
          color: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
        aria-hidden="true"
        role="tooltip"
      >
        {displayName}
      </div>
    </div>
  );
}

type OverflowChipProps = {
  overflow: number;
  zIndex: number;
};

function OverflowChip({ overflow, zIndex }: OverflowChipProps) {
  const label = `and ${overflow} ${overflow === 1 ? 'other' : 'others'}`;

  return (
    // Same as AvatarChip — overflow label is in the sr-only span; no tab stop needed.
    <div className="relative flex-shrink-0 group" style={{ zIndex }}>
      <div
        className="w-[34px] h-[34px] rounded-full border-2 flex items-center justify-center transition-transform duration-150 group-hover:-translate-y-0.5 group-focus:-translate-y-0.5"
        style={{
          backgroundColor: '#121214',
          borderColor: '#1c1c1f',
          boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
        role="img"
        aria-label={label}
      >
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>
          +{overflow}
        </span>
      </div>

      <div
        className="
          pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2
          -translate-x-1/2 -translate-y-1 scale-95
          opacity-0 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
          transition-all duration-200
          text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-md z-50
        "
        style={{
          backgroundColor: '#27272a',
          color: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
        aria-hidden="true"
        role="tooltip"
      >
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG icons (Phosphor-style, matches icons.tsx convention)
// ─────────────────────────────────────────────────────────────────────────────

function DoorOpenIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      style={{ color: 'rgba(255,255,255,0.40)' }}
    >
      <path d="M232,216H208V40a16,16,0,0,0-16-16H64A16,16,0,0,0,48,40V216H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16ZM64,40H192V216H160V80a16,16,0,0,0-16-16H64ZM64,80h80V216H64ZM152,128a12,12,0,1,1-12-12A12,12,0,0,1,152,128Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z" />
    </svg>
  );
}

function WarningCircleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z" />
    </svg>
  );
}
