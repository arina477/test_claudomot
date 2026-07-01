/**
 * AssignmentsPanel — the server assignments page (wave-22 M5).
 *
 * Layout follows design/assignments-panel.html:
 *   - Channel-like header ("Assignments", clipboard icon) with organizer-only "New Assignment" CTA.
 *   - Section header "Upcoming & Recent" + "Sorted by Due Date" caption.
 *   - Assignment list (due-sorted ASC, from GET /servers/:serverId/assignments).
 *   - Empty state when list is empty: clipboard icon + "No assignments yet." + organizer CTA.
 *   - AssignmentForm modal (create/edit) — organizer-only.
 *
 * ORGANIZER check (wave-23 B-3): gated on effective permissions from
 * GET /servers/:serverId/me/permissions. CTA is shown when perms.owner OR
 * perms.manage_assignments is true. While loading or on fetch error the CTA is hidden.
 * The server always enforces; client gate is convenience-only.
 * On 403 from POST/PATCH (permission revoked between load and submit), AssignmentForm
 * surfaces the thrown error as an inline red alert — no new toast system needed.
 */

import type { Assignment } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentForm } from './AssignmentForm';
import { useServers } from './ServerContext';
import { ClipboardTextIcon, PlusIcon, SpinnerIcon } from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanSize(count: number): string {
  return `${count} assignment${count !== 1 ? 's' : ''}`;
}

// ---------------------------------------------------------------------------
// AssignmentsPanel
// ---------------------------------------------------------------------------

type Props = {
  /** Called when the user clicks the "close" or back navigation. */
  onClose?: () => void;
};

export function AssignmentsPanel({ onClose }: Props) {
  const { selectedId: serverId } = useServers();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Assignment | null>(null);

  // Detail modal state (future extension — for now clicking a card is a no-op or opens edit for organizer)
  // We keep this minimal: card click opens edit for organizer; non-organizer gets a read-only detail modal (future wave).

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Effective permissions (wave-23 B-3)
  // ---------------------------------------------------------------------------

  // Fetch session-scoped effective permissions for this server.
  // CTA is hidden while loading or if the fetch fails (e.g. 403 non-member).
  // Gate: perms.owner || perms.manage_assignments (server always enforces).
  type PermsState = 'loading' | 'ready' | 'error';
  const [perms, setPerms] = useState<import('@studyhall/shared').EffectivePermissions | null>(null);
  const [permsStatus, setPermsStatus] = useState<PermsState>('loading');

  useEffect(() => {
    if (!serverId) return;
    setPermsStatus('loading');
    setPerms(null);
    api
      .getMyPermissions(serverId)
      .then((p) => {
        if (!mounted.current) return;
        setPerms(p);
        setPermsStatus('ready');
      })
      .catch(() => {
        if (!mounted.current) return;
        setPermsStatus('error');
      });
  }, [serverId]);

  const isOrganizer =
    permsStatus === 'ready' && perms !== null && (perms.owner || perms.manage_assignments);

  // ---------------------------------------------------------------------------
  // Load assignments
  // ---------------------------------------------------------------------------

  const loadAssignments = useCallback(() => {
    if (!serverId) return;
    setLoadStatus('loading');
    api
      .listAssignments(serverId)
      .then(({ assignments: list }) => {
        if (!mounted.current) return;
        // Already due-sorted by backend (due_date ASC), but sort client-side too for safety
        const sorted = [...list].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
        setAssignments(sorted);
        setLoadStatus('loaded');
      })
      .catch(() => {
        if (!mounted.current) return;
        setLoadStatus('error');
      });
  }, [serverId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // ---------------------------------------------------------------------------
  // Per-member status change handler
  // ---------------------------------------------------------------------------

  const handleStatusChange = useCallback((id: string, state: 'todo' | 'done') => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, myStatus: state } : a)));
  }, []);

  // ---------------------------------------------------------------------------
  // Card click handler — for now: organizer opens edit; member noop (future: detail view)
  // ---------------------------------------------------------------------------

  const handleCardClick = useCallback(
    (assignment: Assignment) => {
      if (isOrganizer) {
        setEditTarget(assignment);
        setFormOpen(true);
      }
      // Non-organizers: detail view is a future wave feature
    },
    [isOrganizer],
  );

  // ---------------------------------------------------------------------------
  // Form success handler
  // ---------------------------------------------------------------------------

  const handleFormSuccess = useCallback((saved: Assignment) => {
    setAssignments((prev) => {
      const exists = prev.find((a) => a.id === saved.id);
      if (exists) {
        // Update in place
        const updated = prev.map((a) => (a.id === saved.id ? saved : a));
        return [...updated].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
      }
      // Insert new
      const next = [...prev, saved].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
      return next;
    });
    setFormOpen(false);
    setEditTarget(null);
  }, []);

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const dueCount = assignments.filter(
    (a) => a.myStatus === 'todo' && new Date(a.dueDate) >= new Date(),
  ).length;

  return (
    <div
      data-testid="assignments-panel"
      className="flex flex-col flex-1 min-w-0 min-h-0"
      style={{ backgroundColor: '#1c1c1f' }}
    >
      {/* Panel header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-6"
        style={{
          backgroundColor: 'rgba(28,28,31,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 24px -8px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              aria-label="Back to channel"
              onClick={onClose}
              className="mr-1 flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 lg:hidden"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              {/* left arrow */}
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.92)' }}>
            <ClipboardTextIcon size={20} />
          </span>
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Assignments
          </h2>
          {dueCount > 0 && (
            <span
              className="inline-flex items-center justify-center rounded text-[10px] font-semibold px-1.5 py-0.5"
              style={{
                backgroundColor: 'rgba(82,82,91,0.50)',
                color: 'rgba(255,255,255,0.60)',
              }}
            >
              {dueCount} Due
            </span>
          )}
        </div>

        {isOrganizer && (
          <button
            type="button"
            data-testid="new-assignment-btn"
            onClick={openCreate}
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#10b981',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0ea5e9';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            <PlusIcon size={14} />
            New Assignment
          </button>
        )}
      </header>

      {/* Scrolling content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          {/* Loading */}
          {loadStatus === 'loading' && (
            <div
              className="flex items-center justify-center py-12"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              <SpinnerIcon size={24} className="sh-animate-spin" />
            </div>
          )}

          {/* Error */}
          {loadStatus === 'error' && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Couldn't load assignments.
              </p>
              <button
                type="button"
                onClick={loadAssignments}
                className="text-xs underline"
                style={{ color: '#10b981' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {loadStatus === 'loaded' && assignments.length === 0 && (
            <div
              data-testid="empty-state"
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                aria-hidden="true"
              >
                <ClipboardTextIcon size={32} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  No assignments yet.
                </h3>
                <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {isOrganizer
                    ? 'Create your first assignment to get started.'
                    : "The organizer hasn't posted any assignments yet."}
                </p>
              </div>
              {isOrganizer && (
                <button
                  type="button"
                  data-testid="empty-state-new-btn"
                  onClick={openCreate}
                  className="flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: '#10b981' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0ea5e9';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                  }}
                >
                  <PlusIcon size={14} />
                  New Assignment
                </button>
              )}
            </div>
          )}

          {/* Loaded — list */}
          {loadStatus === 'loaded' && assignments.length > 0 && (
            <>
              {/* Section header */}
              <div
                className="flex items-end justify-between pb-2"
                style={{ borderBottom: '1px solid #3f3f46' }}
              >
                <h3
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  Upcoming {'&'} Recent
                </h3>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {humanSize(assignments.length)} · Sorted by Due Date
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3">
                {assignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onStatusChange={handleStatusChange}
                    onClick={handleCardClick}
                  />
                ))}
              </div>

              {/* End-of-list indicator */}
              <div className="py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
                <p>You&apos;re all caught up.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assignment Form Modal */}
      {formOpen && serverId && editTarget === null && (
        <AssignmentForm serverId={serverId} onSuccess={handleFormSuccess} onClose={closeForm} />
      )}
      {formOpen && serverId && editTarget !== null && (
        <AssignmentForm
          serverId={serverId}
          assignment={editTarget}
          onSuccess={handleFormSuccess}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
