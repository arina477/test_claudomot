/**
 * StartDmPicker — modal for starting a new 1:1 or group DM.
 *
 * Design: design/direct-messages.html modal section.
 * - Search input to find users (uses GET /dm/candidates — server co-members
 *   of the caller, who_can_dm-filtered, self-excluded, deduped).
 * - Recipient chips: selected users shown as dismissible chips.
 * - who_can_dm restriction: targets that cannot be DMed are not selectable and
 *   show a clear NON-colour-only reason. When create returns 403 the error is
 *   surfaced inline.
 * - Confirm button: "Open DM" (1:1) or "Create Group" (2+ recipients). Disabled
 *   when no recipients are selected or while creating.
 * - Esc closes modal; focus restored to trigger. Focus trap inside modal.
 * - Group cap: selecting ≥10 disables further selection with an explanation.
 * - Group ≥3 recipients → group conversation (isGroup=true server-side).
 *
 * D-3 notes: React focus-trap (Esc/restore focus).
 *
 * wave-47 M8 task 10967558 — rewired to GET /dm/candidates (no serverId gate).
 */

import type { DmCandidate, DmConversation } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { SpinnerIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Recipient = {
  userId: string;
  displayName: string;
};

type Props = {
  onConfirm: (
    participantIds: string[],
  ) => Promise<{ ok: true; conversation: DmConversation } | { ok: false; error: string }>;
  onClose: () => void;
  /** Element that triggered open — focus restored on close. */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
};

// ---------------------------------------------------------------------------
// StartDmPicker
// ---------------------------------------------------------------------------

const MAX_GROUP_RECIPIENTS = 9; // creator auto-added = 10 total

export function StartDmPicker({ onConfirm, onClose, triggerRef }: Props) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<DmCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selected, setSelected] = useState<Recipient[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount; restore trigger focus on unmount.
  useEffect(() => {
    searchInputRef.current?.focus();
    const triggerEl = triggerRef?.current;
    return () => {
      triggerEl?.focus();
    };
  }, [triggerRef]);

  // Esc to close + focus trap
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [onClose]);

  // Load DM candidates from GET /dm/candidates (server co-members, self-excluded,
  // who_can_dm='nobody' filtered, deduped) — no serverId gate.
  useEffect(() => {
    setCandidatesLoading(true);
    api
      .getDmCandidates()
      .then((res) => {
        setCandidates(res);
      })
      .catch(() => setCandidates([]))
      .finally(() => setCandidatesLoading(false));
  }, []);

  const filteredCandidates = query.trim()
    ? candidates.filter((m) => m.displayName.toLowerCase().includes(query.toLowerCase()))
    : candidates;

  const selectedIds = new Set(selected.map((r) => r.userId));
  const atCap = selected.length >= MAX_GROUP_RECIPIENTS;

  function toggleRecipient(candidate: DmCandidate) {
    if (selectedIds.has(candidate.userId)) {
      setSelected((prev) => prev.filter((r) => r.userId !== candidate.userId));
    } else if (!atCap) {
      setSelected((prev) => [
        ...prev,
        { userId: candidate.userId, displayName: candidate.displayName },
      ]);
    }
  }

  function removeRecipient(userId: string) {
    setSelected((prev) => prev.filter((r) => r.userId !== userId));
  }

  const handleConfirm = useCallback(async () => {
    if (selected.length === 0 || creating) return;
    setCreating(true);
    setCreateError(null);
    const result = await onConfirm(selected.map((r) => r.userId));
    setCreating(false);
    if (!result.ok) {
      setCreateError(result.error);
    }
    // On success the parent closes the modal and selects the new conversation.
  }, [selected, onConfirm, creating]);

  const confirmLabel = selected.length > 1 ? 'Create Group' : 'Open DM';
  const canConfirm = selected.length > 0 && !creating;

  return (
    // Backdrop
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Start a new direct message"
        data-testid="start-dm-picker"
        className="relative flex flex-col w-full max-w-[480px] rounded-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-900)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          maxHeight: '80dvh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 h-14 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            New Message
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            style={{ color: 'rgba(255,255,255,0.60)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
            }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 px-4 py-2 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            aria-label="Selected recipients"
          >
            {selected.map((r) => (
              <span
                key={r.userId}
                data-testid={`dm-picker-chip-${r.userId}`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  color: '#6ee7b7',
                  outline: '1px solid rgba(16,185,129,0.30)',
                  outlineOffset: '-1px',
                }}
              >
                {r.displayName}
                <button
                  type="button"
                  aria-label={`Remove ${r.displayName}`}
                  onClick={() => removeRecipient(r.userId)}
                  className="rounded-full focus:outline-none focus-visible:ring-1"
                  style={{ color: 'rgba(110,231,183,0.70)' }}
                >
                  <XIcon size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="px-4 py-3 shrink-0">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search people…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search people to message"
            data-testid="dm-picker-search"
            className="w-full text-sm rounded-md px-3 py-2 outline-none"
            style={{
              backgroundColor: '#27272a',
              border: '1px solid rgba(63,63,70,0.60)',
              color: 'rgba(255,255,255,0.92)',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(16,185,129,0.50)';
              (e.currentTarget as HTMLInputElement).style.boxShadow =
                '0 0 0 2px rgba(16,185,129,0.20)';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(63,63,70,0.60)';
              (e.currentTarget as HTMLInputElement).style.boxShadow = '';
            }}
          />
        </div>

        {/* Cap notice */}
        {atCap && (
          <p className="px-4 pb-2 text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Group DMs are limited to 10 participants (including you).
          </p>
        )}

        {/* Candidate list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {candidatesLoading ? (
            <div className="flex items-center justify-center py-8 gap-2" aria-busy="true">
              <SpinnerIcon
                size={16}
                className="animate-spin"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              />
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Loading…
              </span>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <p
              className="text-sm px-3 py-4 text-center"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              {query
                ? `No people match "${query}"`
                : candidates.length === 0
                  ? 'No one to message yet — join a study server with others'
                  : `No people match "${query}"`}
            </p>
          ) : (
            <div
              role="listbox"
              tabIndex={0}
              aria-multiselectable="true"
              aria-label="Candidate list"
            >
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedIds.has(candidate.userId);
                const isDisabledByAtCap = !isSelected && atCap;

                return (
                  <div key={candidate.userId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleRecipient(candidate)}
                      disabled={isDisabledByAtCap}
                      data-testid={`dm-picker-member-${candidate.userId}`}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                      style={{
                        backgroundColor: isSelected ? 'rgba(16,185,129,0.10)' : 'transparent',
                        cursor: isDisabledByAtCap ? 'not-allowed' : 'pointer',
                        opacity: isDisabledByAtCap ? 0.45 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabledByAtCap)
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                            ? 'rgba(16,185,129,0.15)'
                            : '#27272a';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                          ? 'rgba(16,185,129,0.10)'
                          : 'transparent';
                      }}
                    >
                      {/* Checkmark / avatar placeholder */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{
                          backgroundColor: isSelected ? '#10b981' : '#3f3f46',
                          color: isSelected ? '#0a0a0b' : 'rgba(255,255,255,0.92)',
                        }}
                        aria-hidden="true"
                      >
                        {isSelected ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 256 256"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M40 128 96 184 216 72"
                              stroke="currentColor"
                              strokeWidth="24"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          candidate.displayName.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span
                          className="block text-sm font-medium truncate"
                          style={{ color: isSelected ? '#10b981' : 'rgba(255,255,255,0.92)' }}
                        >
                          {candidate.displayName}
                        </span>
                      </div>

                      {isDisabledByAtCap && (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          Group full
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {createError && (
          <div
            role="alert"
            className="mx-4 mb-3 px-3 py-2 rounded-md text-sm"
            style={{
              backgroundColor: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.30)',
              color: '#fca5a5',
            }}
            data-testid="dm-picker-error"
          >
            {createError}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.70)',
              border: '1px solid rgba(63,63,70,0.60)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
            data-testid="dm-picker-confirm"
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            style={{
              backgroundColor: canConfirm
                ? 'var(--color-accent-emerald)'
                : 'color-mix(in srgb, var(--color-accent-emerald) 40%, transparent)',
              color: canConfirm ? '#0a0a0b' : 'rgba(255,255,255,0.30)',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              boxShadow: canConfirm ? '0 0 0 2px rgba(16,185,129,0.4)' : 'none',
            }}
          >
            {creating ? (
              <span className="flex items-center gap-1.5">
                <SpinnerIcon size={14} className="animate-spin" />
                Creating…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
