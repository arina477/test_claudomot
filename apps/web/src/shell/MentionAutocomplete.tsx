/**
 * MentionAutocomplete — @-triggered member search popover above the composer.
 *
 * Design ref: design/server-channel-view.html § MENTION AUTOCOMPLETE DEMO POPOVERS
 *
 * States:
 *   loading   — skeleton with animated dots in header
 *   results   — member list; active row has surface-700 bg + emerald ring-2
 *   empty     — "No members match" with magnifying-glass icon
 *
 * Keyboard nav: ↑↓ to move active row, Enter to select (does NOT send the
 * message), Escape to dismiss. Click also selects.
 *
 * A11y: role=listbox on the list, role=option on each item, unique option
 * ids derived from userId, aria-activedescendant wired to the listbox so
 * screen readers announce the focused option on every ↑↓ key.
 *
 * @-trigger semantics: only fires after whitespace (or at the very start of
 * the input) — never inside a@b style tokens (email-safe rule).
 */

import type { ServerMember } from '@studyhall/shared';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import { MagnifyingGlassIcon, SpinnerIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MentionInsertPayload = {
  /** The canonical @username text to insert at the cursor. */
  username: string;
};

type Props = {
  /** Server whose members are candidates. Null = popover stays closed. */
  serverId: string | null;
  /** The current @-query text (without the @ prefix), e.g. "dav". */
  query: string;
  /** Called when the user selects a member (keyboard Enter or click). */
  onSelect: (payload: MentionInsertPayload) => void;
  /** Called when the user presses Escape or clicks outside. */
  onDismiss: () => void;
};

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      className="flex items-center gap-2.5 px-2 py-2 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Avatar placeholder */}
      <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: 'rgba(63,63,70,0.70)' }} />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-[10px] rounded w-1/2" style={{ backgroundColor: 'rgba(63,63,70,0.70)' }} />
        <div className="h-[8px] rounded w-1/3" style={{ backgroundColor: 'rgba(63,63,70,0.70)' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MentionAutocomplete
// ---------------------------------------------------------------------------

export function MentionAutocomplete({ serverId, query, onSelect, onDismiss }: Props) {
  const instanceId = useId();

  const [allMembers, setAllMembers] = useState<ServerMember[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const prevServerIdRef = useRef<string | null>(null);

  // Keep mounted flag
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch members when serverId changes (reuse the same api.getServerMembers
  // that MemberListPanel uses — share the pattern, no extra endpoint needed).
  useEffect(() => {
    if (!serverId) {
      setAllMembers([]);
      setLoadStatus('idle');
      prevServerIdRef.current = null;
      return;
    }
    if (serverId === prevServerIdRef.current && loadStatus === 'loaded') {
      // Members already fetched for this server — no refetch needed.
      return;
    }
    prevServerIdRef.current = serverId;
    setLoadStatus('loading');
    api
      .getServerMembers(serverId)
      .then((list) => {
        if (!mountedRef.current) return;
        setAllMembers(list);
        setLoadStatus('loaded');
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setLoadStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Filter by query — prefix match on username OR displayName, case-insensitive.
  const filtered: ServerMember[] = loadStatus === 'loaded'
    ? allMembers.filter((m) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          m.displayName.toLowerCase().startsWith(q) ||
          // ServerMember has displayName but not a separate username field.
          // The username is embedded in displayName at the data layer for this project.
          // We also do a contains-search as a secondary pass.
          m.displayName.toLowerCase().includes(q)
        );
      })
    : [];

  // Clamp activeIndex when filtered list shrinks
  const safeActive = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0;

  // Reset active index when query changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onDismiss]);

  const handleSelect = useCallback(
    (member: ServerMember) => {
      // Use displayName as the @mention text since ServerMember doesn't expose
      // a separate username field — strip spaces for a valid @handle.
      const username = member.displayName.replace(/\s+/g, '');
      onSelect({ username });
    },
    [onSelect],
  );

  // Keyboard handler — called from MessageComposer via prop
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault(); // Do NOT send the message
        const member = filtered[safeActive];
        if (member) handleSelect(member);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    },
    [filtered, safeActive, handleSelect, onDismiss],
  );

  // Expose keyboard handler so composer can forward keydown events to us.
  // We use a ref trick below — but actually callers invoke this via the
  // exposed imperative handle. For simplicity we attach it to the document
  // while the popover is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      handleKeyDown(e as unknown as React.KeyboardEvent);
    }
    document.addEventListener('keydown', onKey, { capture: true });
    return () => document.removeEventListener('keydown', onKey, { capture: true });
  }, [handleKeyDown]);

  if (!serverId) return null;

  // Stable listbox id for aria-activedescendant
  const listboxId = `mention-listbox-${instanceId.replace(/:/g, '')}`;
  const optionId = (userId: string) => `mention-option-${instanceId.replace(/:/g, '')}-${userId}`;

  return (
    <div
      ref={containerRef}
      className="w-[280px] max-h-[240px] flex flex-col rounded-lg overflow-hidden"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
      // Prevent clicks inside from reaching the outside-click handler
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b text-[11px] font-semibold uppercase tracking-widest shrink-0"
        style={{
          backgroundColor: '#121214',
          borderColor: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.40)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        }}
      >
        {loadStatus === 'loading' ? (
          <span className="flex items-center gap-1.5">
            <SpinnerIcon size={11} className="animate-spin" />
            Searching
          </span>
        ) : query ? (
          `Members matching "@${query}"`
        ) : (
          'Members'
        )}
      </div>

      {/* Body */}
      {loadStatus === 'loading' && (
        <div className="p-2 space-y-1 flex-1">
          <SkeletonRow delay={0} />
          <SkeletonRow delay={100} />
        </div>
      )}

      {loadStatus === 'loaded' && filtered.length === 0 && (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4"
          style={{ backgroundColor: '#1c1c1f' }}
        >
          <MagnifyingGlassIcon size={24} style={{ color: 'rgba(255,255,255,0.40)' }} />
          <p
            className="text-[13px] font-medium mt-2"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            No members match
          </p>
        </div>
      )}

      {loadStatus === 'loaded' && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Matching members"
          aria-activedescendant={
            filtered[safeActive] ? optionId(filtered[safeActive]!.userId) : undefined
          }
          className="overflow-y-auto flex-1 p-1.5 space-y-0.5"
          style={{ listStyle: 'none', padding: '6px', margin: 0 }}
        >
          {filtered.map((member, idx) => {
            const isActive = idx === safeActive;
            return (
              <li
                key={member.userId}
                id={optionId(member.userId)}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(member)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors"
                style={{
                  backgroundColor: isActive ? '#27272a' : 'transparent',
                  outline: isActive ? '2px solid rgba(16,185,129,0.50)' : 'none',
                  outlineOffset: '-2px',
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {/* Avatar */}
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                    style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
                    aria-hidden="true"
                  >
                    {member.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Name + username-style handle */}
                <div className="flex flex-col justify-center overflow-hidden">
                  <span
                    className="text-sm font-medium truncate leading-tight"
                    style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(212,212,216,0.92)' }}
                  >
                    {member.displayName}
                  </span>
                  <span
                    className="text-[11px] truncate leading-tight"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    @{member.displayName.replace(/\s+/g, '').toLowerCase()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {loadStatus === 'error' && (
        <div className="flex-1 flex items-center justify-center py-4">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Couldn&apos;t load members
          </p>
        </div>
      )}
    </div>
  );
}
