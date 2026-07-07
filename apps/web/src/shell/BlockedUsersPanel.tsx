/**
 * BlockedUsersPanel — "Blocked users" section for /settings/privacy.
 *
 * Design canonical: design/block-ui.html (D-3 APPROVED wave-70) — left pane.
 *
 * Behaviour:
 *   - Shared useBlocks hook supplies enriched BlockListItem[] (wave-71:
 *     each item carries blockedUser.{displayName, username, avatarUrl}).
 *   - Loading state: shimmer skeleton rows (DESIGN-SYSTEM §114 — shimmer, not spinner).
 *   - Each row: avatar initials + name + username + inline "Unblock" ghost button.
 *   - Inline Unblock: DELETE /blocks/:blocked_id → row removed optimistically.
 *     On failure: row is restored + error toast.
 *   - Toast: role=status (success/default) / role=alert (error).
 *
 * A11y:
 *   - Unblock button: aria-label="Unblock <displayName>".
 *   - Loading: aria-busy on the list container.
 *   - Empty state: icon + heading + descriptive text.
 *
 * Tokens: DESIGN-SYSTEM.md only.
 */

import type { BlockListItem } from '@studyhall/shared';
import { useCallback, useState } from 'react';
import { ProhibitIcon, SpinnerIcon, WarningCircleIcon } from './icons';
import { useBlocks } from './useBlocks';

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error' | 'default';

type ToastMessage = {
  id: string;
  kind: ToastKind;
  text: string;
};

import { useEffect } from 'react';

function Toast({ toast, onGone }: { toast: ToastMessage; onGone: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onGone(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onGone]);

  const isError = toast.kind === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      data-testid={isError ? 'blocked-list-toast-error' : 'blocked-list-toast-success'}
      className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium"
      style={{
        backgroundColor: '#27272a',
        border: isError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        color: 'rgba(255,255,255,0.92)',
      }}
    >
      {isError ? (
        <WarningCircleIcon size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
      ) : (
        <ProhibitIcon size={18} style={{ color: '#10b981', flexShrink: 0 }} />
      )}
      <span>{toast.text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-md"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="w-9 h-9 rounded-full shrink-0"
        style={{ backgroundColor: '#27272a' }}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3.5 rounded" style={{ width: '40%', backgroundColor: '#27272a' }} />
        <div className="h-3 rounded" style={{ width: '25%', backgroundColor: '#1c1c1f' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockedUserRow — single row
// ---------------------------------------------------------------------------

type BlockedUserRowProps = {
  item: BlockListItem;
  onUnblock: (blockedId: string, displayName: string) => Promise<void>;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

function BlockedUserRow({ item, onUnblock }: BlockedUserRowProps) {
  const [busy, setBusy] = useState(false);
  const { displayName, username, avatarUrl } = item.blockedUser;

  async function handleUnblock() {
    if (busy) return;
    setBusy(true);
    await onUnblock(item.blocked_id, displayName);
    // If it fails onUnblock will handle error; if success the row is removed by parent
    setBusy(false);
  }

  return (
    <li
      data-testid={`blocked-row-${item.blocked_id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-md transition-colors duration-150 gap-3 sm:gap-0"
      style={{ border: '1px solid transparent' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLLIElement).style.backgroundColor = 'rgba(255,255,255,0.02)';
        (e.currentTarget as HTMLLIElement).style.borderColor = 'rgba(255,255,255,0.10)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLLIElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLLIElement).style.borderColor = 'transparent';
      }}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="rounded-full object-cover shrink-0"
            style={{ width: 36, height: 36, backgroundColor: '#1c1c1f' }}
            draggable={false}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              width: 36,
              height: 36,
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.92)',
            }}
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </div>
        )}
        <div className="flex flex-col">
          <span
            className="text-sm font-medium leading-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
            data-testid={`blocked-name-${item.blocked_id}`}
          >
            {displayName}
          </span>
          {username && (
            <span
              className="text-xs leading-tight mt-0.5"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              @{username}
            </span>
          )}
        </div>
      </div>

      {/* Unblock button — ghost/neutral per design */}
      <button
        type="button"
        aria-label={`Unblock ${displayName}`}
        data-testid={`unblock-btn-${item.blocked_id}`}
        onClick={() => void handleUnblock()}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.98] self-start sm:self-auto"
        style={{
          height: 32,
          minWidth: 80,
          paddingLeft: 12,
          paddingRight: 12,
          backgroundColor: 'transparent',
          color: 'rgba(255,255,255,0.60)',
          border: '1px solid transparent',
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!busy) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {busy ? <SpinnerIcon size={13} className="animate-spin" /> : <span>Unblock</span>}
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// BlockedUsersPanel
// ---------------------------------------------------------------------------

export function BlockedUsersPanel() {
  const { blocks, loading, error, refetch, unblockUser } = useBlocks();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const handleUnblock = useCallback(
    async (blockedId: string, displayName: string) => {
      const pushToast = (text: string, kind: ToastKind) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, kind, text }]);
      };
      try {
        await unblockUser(blockedId);
        pushToast(`${displayName} unblocked.`, 'default');
      } catch {
        // useBlocks already restored state via re-fetch on failure
        pushToast('Failed to unblock user. Please try again.', 'error');
      }
    },
    [unblockUser],
  );

  // Derive loadStatus for rendering branches
  const loadStatus = loading ? 'loading' : error ? 'error' : 'loaded';

  return (
    <section
      data-testid="blocked-users-panel"
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <header
        className="px-6 py-5 flex flex-col gap-1"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center gap-2 text-sm font-medium mb-1"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          <ProhibitIcon size={16} />
          Blocked Users
        </div>
        <h3
          className="text-[17px] font-semibold leading-none"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Blocked Users
        </h3>
        <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
          Blocked members cannot DM you and their messages are hidden.
        </p>
      </header>

      {/* Body */}
      <div className="p-4 sm:p-6 flex flex-col gap-3 relative">
        {/* Toast area */}
        {toasts.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            {toasts.map((t) => (
              <Toast key={t.id} toast={t} onGone={removeToast} />
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loadStatus === 'loading' && (
          <div
            className="flex flex-col gap-2"
            aria-busy="true"
            aria-label="Loading blocked users"
            data-testid="blocked-users-loading"
          >
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Error */}
        {loadStatus === 'error' && (
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            data-testid="blocked-users-error"
          >
            <WarningCircleIcon size={20} style={{ color: '#ef4444', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Couldn&apos;t load your block list.
            </p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {loadStatus === 'loaded' && blocks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-testid="blocked-users-empty"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: '#27272a',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <ProhibitIcon size={20} style={{ color: 'rgba(255,255,255,0.60)' }} />
            </div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
              You haven&apos;t blocked anyone
            </h4>
            <p className="text-xs max-w-[240px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              When you block a user for your safety, they will appear here.
            </p>
          </div>
        )}

        {/* Populated list */}
        {loadStatus === 'loaded' && blocks.length > 0 && (
          <ul
            className="flex flex-col gap-1"
            data-testid="blocked-users-list"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {blocks.map((item) => (
              <BlockedUserRow key={item.blocked_id} item={item} onUnblock={handleUnblock} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
