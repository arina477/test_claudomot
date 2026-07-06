/**
 * AssignmentsPanel — the server assignments page (wave-22 M5 + wave-42 M9).
 *
 * Layout follows design/assignments-panel.html:
 *   - Channel-like header ("Assignments", clipboard icon) with organizer-only "New Assignment" CTA.
 *   - Section header "Upcoming & Recent" + "Sorted by Due Date" caption.
 *   - Assignment list (due-sorted ASC, from GET /servers/:serverId/assignments).
 *   - Each AssignmentCard includes the student submit/return UI (wave-42).
 *   - Empty state when list is empty: clipboard icon + "No assignments yet." + organizer CTA.
 *   - AssignmentForm modal (create/edit) — organizer-only.
 *
 * ORGANIZER check (wave-23 B-3 + wave-42 M9): gated on effective permissions from
 * GET /servers/:serverId/me/permissions. CTA shown when perms.owner OR
 * perms.manage_assignments is true. Server always enforces; client gate is convenience-only.
 *
 * wave-42 additions:
 *   - AssignmentCard receives serverId + onAnnounce for submission flow.
 *   - SubmissionsRoster rendered below each card when isOrganizer and card expanded.
 *   - aria-live announcer region for a11y state announcements.
 */

import type { Assignment } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { ErrorState } from '../components/states/ErrorState';
import { getCachedAssignments, putCachedAssignments } from '../features/sync/cache';
import { db } from '../features/sync/db';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentForm } from './AssignmentForm';
import { useServers } from './ServerContext';
import { SubmissionsRoster } from './SubmissionsRoster';
import { ClipboardTextIcon, PlusIcon } from './icons';

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

  // A11y live-region announcer
  const announceRef = useRef<HTMLDivElement>(null);
  function announce(msg: string) {
    if (!announceRef.current) return;
    announceRef.current.textContent = msg;
    setTimeout(() => {
      if (announceRef.current?.textContent === msg) {
        announceRef.current.textContent = '';
      }
    }, 3000);
  }

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
        const sorted = [...list].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
        setAssignments(sorted);
        setLoadStatus('loaded');
        // Write-through: persist to offline cache so the list is available when offline.
        if (db) {
          void putCachedAssignments(db, serverId, list);
        }
      })
      .catch(() => {
        if (!mounted.current) return;
        // Offline fallback — serve the last-known assignment list from cache.
        if (db) {
          getCachedAssignments(db, serverId)
            .then((cached) => {
              if (!mounted.current) return;
              if (cached.length > 0) {
                const sorted = [...cached].sort(
                  (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
                );
                setAssignments(sorted);
                setLoadStatus('loaded');
              } else {
                setLoadStatus('loaded');
              }
            })
            .catch(() => {
              if (!mounted.current) return;
              setLoadStatus('error');
            });
        } else {
          setLoadStatus('error');
        }
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
  // Card click handler
  // ---------------------------------------------------------------------------

  const handleCardClick = useCallback(
    (assignment: Assignment) => {
      if (isOrganizer) {
        setEditTarget(assignment);
        setFormOpen(true);
      }
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
        const updated = prev.map((a) => (a.id === saved.id ? saved : a));
        return [...updated].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
      }
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
      {/* A11y live-region announcer — screen reader only */}
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="a11y-announcer"
      />

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
              className="flex flex-col gap-3 animate-pulse"
              aria-busy="true"
              aria-label="Loading assignments"
              data-testid="assignments-skeleton"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: '#27272a',
                    borderColor: 'rgba(63,63,70,0.40)',
                  }}
                  aria-hidden="true"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-4 w-48 rounded-md" style={{ backgroundColor: '#3f3f46' }} />
                      <div
                        className="h-5 w-20 shrink-0 rounded-full"
                        style={{ backgroundColor: '#3f3f46' }}
                      />
                    </div>
                    <div className="h-3 w-full rounded-md" style={{ backgroundColor: '#3f3f46' }} />
                    <div
                      className={`h-3 rounded-md ${i % 2 === 0 ? 'w-2/3' : 'w-3/4'}`}
                      style={{ backgroundColor: '#3f3f46' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {loadStatus === 'error' && (
            <ErrorState
              data-testid="assignments-error"
              message="Couldn't load assignments. Check your connection and try again."
              onRetry={loadAssignments}
            />
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

              {/* Cards + roster */}
              <div className="flex flex-col gap-8">
                {assignments.map((a) => (
                  <div key={a.id} className="flex flex-col gap-4">
                    <AssignmentCard
                      assignment={a}
                      serverId={serverId ?? ''}
                      onStatusChange={handleStatusChange}
                      onClick={handleCardClick}
                      onAnnounce={announce}
                      isOrganizer={isOrganizer}
                    />
                    {/* Educator submissions roster — manage_assignments gated */}
                    {isOrganizer && (
                      <SubmissionsRoster
                        assignmentId={a.id}
                        isOrganizer={isOrganizer}
                        onAnnounce={announce}
                      />
                    )}
                  </div>
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
