/**
 * ReportInbox — moderator/owner view of open reports for a server.
 *
 * Design canonical: design/moderation-report.html (D-3 APPROVED wave-69) — inbox canvas.
 *
 * Gate: renders nothing unless the viewer holds moderate_members (or owner).
 * Data: GET /servers/:serverId/reports?status=open → Report[].
 *
 * Row anatomy (per design):
 *   - Reporter name (reporter_id — displayed as-is; display-name resolution is deferred)
 *   - What was reported: target_type badge + relevant id label
 *   - Reason (blockquote-style left-border)
 *   - Timestamp (created_at)
 *   - Actions: target-type-specific primary danger button + ghost Dismiss
 *
 * Action buttons per target_type:
 *   'message' → Delete Message  (action: 'delete_message') + Dismiss
 *   'member'  → Timeout 24h     (action: 'timeout')        + Dismiss
 *   'server'  → Dismiss only    (no primary destructive action for server reports)
 *
 * States:
 *   loading  — shimmer skeleton rows
 *   list     — report rows (fadeOutUp animation on resolve)
 *   empty    — "All clear" illustration
 *   error    — inline retryable error
 *   actioning/resolved — row-level: spinner on action button; on success row leaves; on error row stays + error toast
 *
 * A11y:
 *   - Toasts: role="alert" aria-live="assertive" (error) / role="status" aria-live="polite" (success)
 *   - aria-busy on loading state
 *   - Each report row is an <article>
 */

import type { Report, ResolveReportAction } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import { SpinnerIcon, WarningCircleIcon } from './icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(isoString).toLocaleDateString();
  } catch {
    return '';
  }
}

function targetLabel(report: Report): string {
  if (report.target_type === 'message') return report.target_message_id ?? 'message';
  if (report.target_type === 'member') return report.target_user_id ?? 'member';
  return report.target_server_id;
}

function targetTypeCopy(type: Report['target_type']): string {
  if (type === 'message') return 'reported a message';
  if (type === 'member') return 'reported a member';
  return 'reported a resource';
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error';
type ToastEntry = { id: string; kind: ToastKind; text: string };

function Toast({ toast, onGone }: { toast: ToastEntry; onGone: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onGone(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onGone]);

  const isError = toast.kind === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      data-testid={isError ? 'inbox-toast-error' : 'inbox-toast-success'}
      className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium"
      style={{
        backgroundColor: '#27272a',
        border: isError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isError
          ? '0 0 15px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.6)'
          : '0 8px 32px rgba(0,0,0,0.6)',
        color: 'rgba(255,255,255,0.92)',
        pointerEvents: 'auto',
      }}
    >
      {isError ? (
        <WarningCircleIcon size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
      ) : (
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )}
      <span>{toast.text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function InboxSkeleton() {
  return (
    <div className="space-y-6 pt-2" aria-busy="true" aria-label="Loading reports">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="py-6 px-4 -mx-4 flex gap-4 sm:gap-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Avatar skeleton */}
          <div
            className="w-10 h-10 rounded-full hidden sm:block shrink-0"
            style={{
              background: 'linear-gradient(90deg, #1c1c1f 25%, #27272a 50%, #1c1c1f 75%)',
              backgroundSize: '200% 100%',
              animation: 'inbox-shimmer 1.5s infinite linear',
            }}
          />
          <div className="flex-1 space-y-4">
            <div
              className="h-4 rounded"
              style={{
                width: 192,
                background: 'linear-gradient(90deg, #1c1c1f 25%, #27272a 50%, #1c1c1f 75%)',
                backgroundSize: '200% 100%',
                animation: 'inbox-shimmer 1.5s infinite linear',
              }}
            />
            <div
              className="h-12 rounded-md max-w-sm"
              style={{
                background: 'linear-gradient(90deg, #1c1c1f 25%, #27272a 50%, #1c1c1f 75%)',
                backgroundSize: '200% 100%',
                animation: 'inbox-shimmer 1.5s infinite linear',
              }}
            />
            <div
              className="h-8 rounded-md"
              style={{
                width: '75%',
                opacity: 0.6,
                background: 'linear-gradient(90deg, #1c1c1f 25%, #27272a 50%, #1c1c1f 75%)',
                backgroundSize: '200% 100%',
                animation: 'inbox-shimmer 1.5s infinite linear',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function InboxEmpty() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative"
        style={{
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <svg
          width={32}
          height={32}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 className="text-[18px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
        All clear
      </h3>
      <p className="text-sm max-w-[280px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
        No open reports. Your community is running smoothly.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report row
// ---------------------------------------------------------------------------

type RowActionState = 'idle' | 'actioning' | 'resolved';

type ReportRowProps = {
  report: Report;
  serverId: string;
  onResolved: (reportId: string) => void;
  onError: (text: string) => void;
};

function ReportRow({ report, serverId, onResolved, onError }: ReportRowProps) {
  const [rowState, setRowState] = useState<RowActionState>('idle');

  async function handleAction(action: ResolveReportAction) {
    setRowState('actioning');
    try {
      await api.resolveReport(serverId, report.id, action);
      setRowState('resolved');
      // Animate out then notify parent
      setTimeout(() => onResolved(report.id), 420);
      const actMsg =
        action === 'delete_message'
          ? 'Content deleted'
          : action === 'timeout'
            ? 'Member timed out'
            : 'Report dismissed';
      onError(`__success__:${actMsg} successfully.`);
    } catch {
      setRowState('idle');
      onError('Network error: Failed to process action. Please try again.');
    }
  }

  const isActioning = rowState === 'actioning';
  const isResolved = rowState === 'resolved';

  return (
    <article
      data-testid={`report-row-${report.id}`}
      className="py-6 px-4 -mx-4 rounded-lg"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'background-color 150ms ease, box-shadow 150ms ease',
        ...(isResolved
          ? {
              overflow: 'hidden',
              animation: 'report-row-dismiss 400ms cubic-bezier(0.16,1,0.3,1) forwards',
            }
          : {}),
      }}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Avatar col */}
        <div className="pt-1 hidden sm:block shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
            aria-hidden="true"
          >
            {report.reporter_id.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Content col */}
        <div className="flex-1 min-w-0">
          {/* Header: reporter + target description + timestamp */}
          <div
            className="flex items-baseline gap-2 mb-1 flex-wrap"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            <h3 className="font-medium" style={{ fontSize: 14 }}>
              {report.reporter_id}
            </h3>
            <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12 }}>
              {targetTypeCopy(report.target_type)}
            </span>
            <span className="sm:ml-auto" style={{ color: 'rgba(255,255,255,0.60)', fontSize: 11 }}>
              {formatRelativeTime(report.created_at)}
            </span>
          </div>

          {/* Target chip */}
          {report.target_type === 'message' ? (
            <div
              className="rounded-md p-3 border mb-3 inline-block max-w-full relative"
              style={{
                backgroundColor: '#0a0a0b',
                borderColor: 'rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
              }}
            >
              <p
                className="text-sm truncate"
                style={{ color: 'rgba(255,255,255,0.60)', maxWidth: 360 }}
              >
                Message ID: {report.target_message_id}
              </p>
              {/* Danger left accent bar */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: -1,
                  top: '12.5%',
                  width: 3,
                  height: '75%',
                  backgroundColor: '#ef4444',
                  borderRadius: '0 2px 2px 0',
                }}
              />
            </div>
          ) : report.target_type === 'member' ? (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5 border mb-3 inline-flex"
              style={{
                backgroundColor: '#0a0a0b',
                borderColor: 'rgba(255,255,255,0.06)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                width: 'max-content',
                maxWidth: '100%',
              }}
            >
              {/* User circle */}
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                style={{ color: 'rgba(255,255,255,0.60)', flexShrink: 0 }}
              >
                <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zM12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
              </svg>
              <span className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {report.target_user_id}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-md p-2 border mb-3 inline-flex"
              style={{
                backgroundColor: '#1c1c1f',
                borderColor: 'rgba(255,255,255,0.06)',
                width: 'max-content',
                maxWidth: '100%',
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center border"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.20)',
                  borderColor: 'rgba(16,185,129,0.30)',
                }}
              >
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {targetLabel(report)}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1 mb-4">
            <p
              className="uppercase tracking-wider font-semibold"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}
            >
              Reason provided
            </p>
            {report.reason ? (
              <p
                className="text-sm pl-2"
                style={{
                  color: 'rgba(255,255,255,0.92)',
                  borderLeft: '2px solid #3f3f46',
                }}
              >
                {report.reason}
              </p>
            ) : (
              <p
                className="text-sm font-mono italic rounded-md p-2"
                style={{
                  color: 'rgba(255,255,255,0.60)',
                  backgroundColor: '#0a0a0b',
                  fontSize: 13,
                }}
              >
                No reason provided.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary danger action — varies by target_type */}
            {report.target_type === 'message' && (
              <button
                type="button"
                data-testid={`report-action-delete-${report.id}`}
                onClick={() => void handleAction('delete_message')}
                disabled={isActioning}
                className="inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none"
                style={{
                  height: 34,
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  cursor: isActioning ? 'not-allowed' : 'pointer',
                  opacity: isActioning ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActioning)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#991b1b';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isActioning ? (
                  <SpinnerIcon size={13} className="animate-spin" />
                ) : (
                  /* Trash icon inline */
                  <svg
                    width={13}
                    height={13}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                )}
                Delete Message
              </button>
            )}

            {report.target_type === 'member' && (
              <button
                type="button"
                data-testid={`report-action-timeout-${report.id}`}
                onClick={() => void handleAction('timeout')}
                disabled={isActioning}
                className="inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none"
                style={{
                  height: 34,
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  cursor: isActioning ? 'not-allowed' : 'pointer',
                  opacity: isActioning ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActioning)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#991b1b';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(239,68,68,0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isActioning ? (
                  <SpinnerIcon size={13} className="animate-spin" />
                ) : (
                  <svg
                    width={13}
                    height={13}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
                Timeout 24h
              </button>
            )}

            {/* Dismiss — ghost, always shown */}
            <button
              type="button"
              data-testid={`report-action-dismiss-${report.id}`}
              onClick={() => void handleAction('dismiss')}
              disabled={isActioning}
              className="inline-flex items-center rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none"
              style={{
                height: 34,
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.60)',
                cursor: isActioning ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActioning) {
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
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// ReportInbox
// ---------------------------------------------------------------------------

type LoadState = 'loading' | 'loaded' | 'error';

export type ReportInboxProps = {
  serverId: string;
  /**
   * Whether the viewer has moderate_members permission.
   * When false (or undefined) the inbox renders nothing — callers should
   * conditionally render based on their own permission fetch to avoid
   * an empty paint, but the gate is also enforced here for safety.
   */
  canModerateMembers: boolean;
};

export function ReportInbox({ serverId, canModerateMembers }: ReportInboxProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchReports = useCallback(() => {
    setLoadState('loading');
    api
      .getServerReports(serverId, 'open')
      .then((list) => {
        if (!mountedRef.current) return;
        setReports(list);
        setLoadState('loaded');
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setLoadState('error');
      });
  }, [serverId]);

  useEffect(() => {
    if (!canModerateMembers) return;
    fetchReports();
  }, [canModerateMembers, fetchReports]);

  const addToast = useCallback((text: string, kind: ToastKind) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, kind, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handles both errors and __success__:... prefixed success notifications from rows
  function handleRowMessage(msg: string) {
    if (msg.startsWith('__success__:')) {
      addToast(msg.slice('__success__:'.length), 'success');
    } else {
      addToast(msg, 'error');
    }
  }

  function handleResolved(reportId: string) {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  // Gate: non-moderators see nothing
  if (!canModerateMembers) return null;

  return (
    <>
      {/* Toast container */}
      <div
        className="fixed bottom-6 z-[60] left-0 right-0 px-4 flex flex-col sm:items-end gap-2"
        style={{ pointerEvents: 'none' }}
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onGone={removeToast} />
        ))}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes inbox-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes report-row-dismiss {
          from { opacity: 1; transform: translateY(0); max-height: 400px; padding-top: 1.5rem; padding-bottom: 1.5rem; }
          to   { opacity: 0; transform: translateY(-10px); max-height: 0; padding-top: 0; padding-bottom: 0; border-bottom-width: 0; }
        }
      `}</style>

      <section
        data-testid="report-inbox"
        className="flex flex-col flex-1 overflow-hidden"
        style={{ backgroundColor: '#1c1c1f' }}
        aria-label="Active Reports"
      >
        {/* Header */}
        <header
          className="h-[72px] shrink-0 flex items-center px-6 lg:px-8"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2
            className="text-[20px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}
          >
            Active Reports
          </h2>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
          {loadState === 'loading' && <InboxSkeleton />}

          {loadState === 'error' && (
            <div
              role="alert"
              className="flex flex-col items-center justify-center min-h-[200px] text-center gap-4"
            >
              <WarningCircleIcon size={32} style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Couldn&apos;t load reports.
              </p>
              <button
                type="button"
                onClick={fetchReports}
                className="rounded-md px-4 py-2 text-sm font-semibold focus-visible:outline-none"
                style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
              >
                Retry
              </button>
            </div>
          )}

          {loadState === 'loaded' && reports.length === 0 && <InboxEmpty />}

          {loadState === 'loaded' && reports.length > 0 && (
            <div className="max-w-4xl mx-auto">
              {reports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  serverId={serverId}
                  onResolved={handleResolved}
                  onError={handleRowMessage}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
