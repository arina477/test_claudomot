/**
 * PrivacyActivityPanel — "Your privacy activity" read-only list section for
 * /settings/privacy.
 *
 * wave-73 B-3 task 5a2521bc.
 *
 * Behaviour:
 *   - Fetches GET /profile/privacy-events on mount via api.getPrivacyEvents().
 *   - Loading state: shimmer skeleton rows (DESIGN-SYSTEM §114 — shimmer, not spinner).
 *   - Error state: descriptive message + "Try again" retry button.
 *   - Empty state: icon + "No privacy activity yet" heading + hint text.
 *   - Loaded list: events rendered newest-first (backend returns DESC) as
 *     plain-language labels with relative timestamps.
 *
 * Plain-language labels by eventType:
 *   account_deleted           → "You deleted your account"
 *   data_exported             → "You exported your data"
 *   privacy_settings_changed  → "You changed your privacy settings"
 *                               + if context has visibilityFrom/To:
 *                               " (profile visibility X → Y)"
 *   user_blocked              → "You blocked a user"
 *   user_unblocked            → "You unblocked a user"
 *
 * Tokens: DESIGN-SYSTEM.md only.
 * Dark-theme only; accessible.
 */

import type { PrivacyEvent, PrivacyEventType } from '@studyhall/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../auth/api';
import { ClockIcon, WarningCircleIcon } from './icons';

// ---------------------------------------------------------------------------
// Relative timestamp formatter (mirrors DmConversationList.formatRelativeTimestamp)
// ---------------------------------------------------------------------------

function formatRelativeTimestamp(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'Just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Plain-language label builder
// ---------------------------------------------------------------------------

function visibilityLabel(v: unknown): string {
  if (v === 'everyone') return 'Visible to classmates';
  if (v === 'nobody') return 'Hidden';
  if (v === 'server-members') return 'Visible to classmates';
  return String(v);
}

function buildLabel(eventType: PrivacyEventType, context: Record<string, unknown> | null): string {
  switch (eventType) {
    case 'account_deleted':
      return 'You deleted your account';
    case 'data_exported':
      return 'You exported your data';
    case 'privacy_settings_changed': {
      const base = 'You changed your privacy settings';
      if (context != null && 'visibilityFrom' in context && 'visibilityTo' in context) {
        const from = visibilityLabel(context.visibilityFrom);
        const to = visibilityLabel(context.visibilityTo);
        if (from !== to) {
          return `${base} (profile visibility ${from} → ${to})`;
        }
      }
      return base;
    }
    case 'user_blocked':
      return 'You blocked a user';
    case 'user_unblocked':
      return 'You unblocked a user';
    default:
      return eventType;
  }
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
        className="w-7 h-7 rounded-full shrink-0"
        style={{ backgroundColor: '#27272a' }}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3.5 rounded" style={{ width: '55%', backgroundColor: '#27272a' }} />
        <div className="h-3 rounded" style={{ width: '20%', backgroundColor: '#1c1c1f' }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventRow — single event row
// ---------------------------------------------------------------------------

function EventRow({ event }: { event: PrivacyEvent }) {
  const label = buildLabel(event.eventType, event.context);
  const ts = formatRelativeTimestamp(event.createdAt);

  return (
    <li
      data-testid={`privacy-event-row-${event.id}`}
      className="flex items-start gap-3 px-3 py-2.5 rounded-md"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: '#27272a' }}
        aria-hidden="true"
      >
        <ClockIcon size={14} style={{ color: 'rgba(255,255,255,0.40)' }} />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span
          className="text-sm leading-snug"
          style={{ color: 'rgba(255,255,255,0.92)' }}
          data-testid={`privacy-event-label-${event.id}`}
        >
          {label}
        </span>
        {ts && (
          <span
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            data-testid={`privacy-event-ts-${event.id}`}
          >
            {ts}
          </span>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// PrivacyActivityPanel
// ---------------------------------------------------------------------------

export function PrivacyActivityPanel() {
  const [events, setEvents] = useState<PrivacyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError(false);
    api
      .getPrivacyEvents()
      .then((res) => setEvents(res.events))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const loadStatus = loading ? 'loading' : error ? 'error' : 'loaded';

  return (
    <section
      data-testid="privacy-activity-panel"
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
          <ClockIcon size={16} />
          Privacy Activity
        </div>
        <h3
          className="text-[17px] font-semibold leading-none"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Your privacy activity
        </h3>
        <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
          A log of privacy-related actions you have taken on your account.
        </p>
      </header>

      {/* Body */}
      <div className="p-4 sm:p-6 flex flex-col gap-3">
        {/* Loading skeleton */}
        {loadStatus === 'loading' && (
          <div
            className="flex flex-col gap-2"
            aria-busy="true"
            aria-label="Loading privacy activity"
            data-testid="privacy-activity-loading"
          >
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Error */}
        {loadStatus === 'error' && (
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            data-testid="privacy-activity-error"
          >
            <WarningCircleIcon size={20} style={{ color: '#ef4444', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Couldn&apos;t load your privacy activity.
            </p>
            <button
              type="button"
              onClick={fetchEvents}
              data-testid="privacy-activity-retry"
              className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {loadStatus === 'loaded' && events.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-testid="privacy-activity-empty"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: '#27272a',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <ClockIcon size={20} style={{ color: 'rgba(255,255,255,0.60)' }} />
            </div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.92)' }}>
              No privacy activity yet
            </h4>
            <p className="text-xs max-w-[240px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Privacy-related actions you take will appear here.
            </p>
          </div>
        )}

        {/* Populated list */}
        {loadStatus === 'loaded' && events.length > 0 && (
          <ul
            className="flex flex-col gap-2"
            data-testid="privacy-activity-list"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
