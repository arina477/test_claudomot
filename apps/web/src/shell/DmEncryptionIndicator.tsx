/**
 * DmEncryptionIndicator — the honest, fail-closed E2E status indicator (wave-79).
 *
 * Adopted design: design/e2e-indicator.html (D-3). Six states, two placements:
 *   - placement='header'  → the conversation-header badge (pill + label).
 *   - placement='message' → the per-message micro-affordance (icon + short label).
 *
 * SHIP-BLOCKER honesty rule: the emerald filled shield-check (the ONLY lock/
 * shield affordance) is rendered ONLY for state 'encrypted'. Every other state
 * renders a NON-lock glyph (open lock / slashed shield / key / spinner). There
 * is no code path that shows a padlock without provable encryption.
 *
 * Tokens are consumed verbatim from design/DESIGN-SYSTEM.md (no invented hex).
 */

import type { DmEncryptionState } from './dmEncryptionState';
import { KeyIcon, LockOpenIcon, ShieldCheckFillIcon, ShieldSlashIcon, SpinnerIcon } from './icons';

// Design-system tokens (dark-only MVP).
const EMERALD = '#10b981';
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.60)';
const SURFACE_700 = '#27272a';
const HAIRLINE = 'rgba(255,255,255,0.06)';
const EMERALD_TINT_BG = 'rgba(16,185,129,0.10)';
const EMERALD_TINT_BORDER = 'rgba(16,185,129,0.20)';

const ICON_SIZE = 16; // D-3 B-3 impl note: icon size 16px.

type StatePresentation = {
  /** Short label for header badge / message affordance. */
  label: string;
  /** Longer descriptive tooltip / a11y text. */
  description: string;
  icon: 'shield-check' | 'lock-open' | 'shield-slash' | 'key' | 'spinner';
  /** Whether this is the (sole) encrypted/lock state. */
  isLock: boolean;
};

const PRESENTATION: Record<DmEncryptionState, StatePresentation> = {
  encrypted: {
    label: 'End-to-end encrypted',
    // F1 (wave-79 B-6): honestly bound the claim. Keys are distributed via the
    // server in v1 (no safety-number verification yet), so the tooltip does NOT
    // imply protection against a malicious server — it states only what is true:
    // content is encrypted on this device to the other person's device.
    description:
      'Messages are encrypted on your device and decrypted on theirs. Keys are exchanged through StudyHall’s server.',
    icon: 'shield-check',
    isLock: true,
  },
  'not-encrypted-plaintext': {
    label: 'Not encrypted',
    description: 'Not end-to-end encrypted — the other person hasn’t set up secure messaging yet.',
    icon: 'lock-open',
    isLock: false,
  },
  'not-encrypted-group': {
    label: 'Not encrypted',
    description: 'Group conversations are not end-to-end encrypted yet.',
    icon: 'shield-slash',
    isLock: false,
  },
  'cannot-decrypt': {
    label: 'Message cannot be decrypted on this device',
    description: 'This message cannot be decrypted on this device. No valid key is present.',
    icon: 'key',
    isLock: false,
  },
  loading: {
    label: 'Establishing…',
    description: 'Setting up secure messaging — this takes a moment the first time.',
    icon: 'spinner',
    isLock: false,
  },
};

function StateIcon({ icon, color }: { icon: StatePresentation['icon']; color: string }) {
  const style = { color };
  switch (icon) {
    case 'shield-check':
      // data-testid on the SOLE lock/shield affordance — honesty tests assert
      // this element is ABSENT in every non-encrypted state.
      return (
        <span data-testid="e2e-lock-affordance">
          <ShieldCheckFillIcon size={ICON_SIZE} style={style} />
        </span>
      );
    case 'lock-open':
      return <LockOpenIcon size={ICON_SIZE} style={style} />;
    case 'shield-slash':
      return <ShieldSlashIcon size={ICON_SIZE} style={style} />;
    case 'key':
      return <KeyIcon size={ICON_SIZE} style={style} />;
    default:
      return <SpinnerIcon size={ICON_SIZE} className="animate-spin" />;
  }
}

type Props = {
  state: DmEncryptionState;
  placement: 'header' | 'message';
};

export function DmEncryptionIndicator({ state, placement }: Props) {
  const p = PRESENTATION[state];
  const iconColor = p.isLock ? EMERALD : TEXT_SECONDARY;

  if (placement === 'message') {
    // Per-message micro-affordance: icon + short label, de-emphasized.
    return (
      <div
        data-testid="dm-msg-encryption-indicator"
        data-encryption-state={state}
        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium select-none"
        style={{ color: p.isLock ? EMERALD : TEXT_SECONDARY }}
      >
        <span aria-hidden="true" className="flex items-center">
          <StateIcon icon={p.icon} color={iconColor} />
        </span>
        <span>{p.label}</span>
      </div>
    );
  }

  // Header badge: pill with label. Emerald-tinted only for the encrypted state.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={p.description}
      data-testid="dm-header-encryption-indicator"
      data-encryption-state={state}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
      style={
        p.isLock
          ? { backgroundColor: EMERALD_TINT_BG, border: `1px solid ${EMERALD_TINT_BORDER}` }
          : { backgroundColor: SURFACE_700, border: `1px solid ${HAIRLINE}` }
      }
    >
      <span aria-hidden="true" className="flex items-center">
        <StateIcon icon={p.icon} color={iconColor} />
      </span>
      <span style={{ color: p.isLock ? TEXT_PRIMARY : TEXT_SECONDARY }}>{p.label}</span>
    </div>
  );
}
