/**
 * EducatorAdminConsole — read-only educator admin console for the server
 * settings surface. wave-76 M13 (Educator Admin Console), task d81e266d.
 *
 * Ported from design/educator-admin-console.html (D-3 canonicalized mockup):
 * a calm, read-only console that renders server-scoped aggregate analytics as
 * scannable stat cards across four states.
 *
 * Data:
 *   Fetches GET /servers/:serverId/educator-tools/analytics on mount. The
 *   endpoint returns ServerAnalytics — aggregate COUNTS + ROLLUPS only, no PII.
 *   ALL displayed values are wired to the real response — no placeholder
 *   strings from the mockup ("Sync 2m ago", "142 total events") survive.
 *
 * States (D-3 port):
 *   - loading    — skeleton dashboard.
 *   - loaded     — the four analytics groups as stat cards + recent activity.
 *   - empty      — "No activity yet" when every aggregate is zero.
 *   - forbidden  — clean access-denied surface, shown when the analytics fetch
 *                  returns 403 (server is authoritative on the educator-member
 *                  distinction — the client gate below is best-effort UX).
 *
 * Gating (best-effort client UX; the SERVER is authoritative and 403s):
 *   The parent (ServerOverviewSettings) resolves the caller's opaque userId via
 *   getMe() and the owner gate (getMe().userId === ownerId — BUILD-13, never
 *   username), and reads the server plan's `educatorAdminTools` entitlement.
 *   The console entry is only surfaced when BOTH `educatorToolsEnabled` (tier
 *   enables the flag) AND `canAccess` (caller is owner/educator) are true. A
 *   non-entitled / non-authorized caller does not see the entry; if the fetch
 *   403s anyway, we render the forbidden state gracefully.
 *
 * Chrome + tokens mirror ServerPlanPanel / ServerRolesPage / ServerOverview-
 * Settings — DESIGN-SYSTEM.md only, dark-theme, accessible. No invented hex.
 * Icons come from the shipped inline-SVG set (./icons) — never the Phosphor
 * CDN webfont.
 */

import type { ServerAnalytics } from '@studyhall/shared';
import { useCallback, useEffect, useState } from 'react';
import { HttpError, api } from '../auth/api';
import {
  ChatsCircleIcon,
  ClipboardTextIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  UsersIcon,
  WarningCircleIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type EducatorAdminConsoleProps = {
  serverId: string;
  /**
   * Whether the current caller owns this server OR is an educator. Resolved by
   * the parent via getMe().userId === ownerId (opaque-id comparison — BUILD-13).
   * Best-effort client gate; the SERVER is authoritative (403s otherwise).
   */
  canAccess: boolean;
  /**
   * Whether the server tier enables the educatorAdminTools entitlement.
   * Read by the parent from the ServerPlan's entitlements. Console entry is
   * only surfaced when this AND `canAccess` are both true.
   */
  educatorToolsEnabled: boolean;
};

type LoadStatus = 'loading' | 'loaded' | 'forbidden' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when every aggregate in the analytics payload is zero / empty. */
function isEmptyAnalytics(a: ServerAnalytics): boolean {
  const activityTotal = a.recentActivity.reduce((sum, b) => sum + b.count, 0);
  return (
    a.memberCount === 0 &&
    a.messageVolume === 0 &&
    a.assignmentCount === 0 &&
    a.submissionRollup.assignmentCount === 0 &&
    a.submissionRollup.submissionCount === 0 &&
    activityTotal === 0
  );
}

/** Sum of the members counted across the role breakdown (educators + others). */
function roleMemberSum(a: ServerAnalytics): number {
  return a.roleBreakdown.reduce((sum, r) => sum + r.memberCount, 0);
}

const NUM = new Intl.NumberFormat('en-US');

// DS tokens (dark-only). Mirrored from ServerPlanPanel / the adopted mockup.
const SURFACE_800 = '#1c1c1f';
const SURFACE_900 = '#121214';
const HAIRLINE = 'rgba(255,255,255,0.06)';
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.60)';
const TEXT_MUTED = 'rgba(255,255,255,0.40)';
const EMERALD = '#10b981';

// ---------------------------------------------------------------------------
// EducatorAdminConsole
// ---------------------------------------------------------------------------

export function EducatorAdminConsole({
  serverId,
  canAccess,
  educatorToolsEnabled,
}: EducatorAdminConsoleProps) {
  const [analytics, setAnalytics] = useState<ServerAnalytics | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');

  // Best-effort client gate. When the tier does not enable educator tools OR the
  // caller is not owner/educator, the console entry is not surfaced at all.
  const gated = educatorToolsEnabled && canAccess;

  const fetchAnalytics = useCallback(() => {
    let cancelled = false;
    setLoadStatus('loading');
    api
      .getServerEducatorAnalytics(serverId)
      .then((res) => {
        if (cancelled) return;
        setAnalytics(res);
        setLoadStatus('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        // The server is authoritative on the educator-member distinction — a
        // 403 means the caller isn't entitled; render the forbidden state.
        const is403 =
          err instanceof HttpError
            ? err.status === 403
            : err instanceof Error && err.message.includes('403');
        setLoadStatus(is403 ? 'forbidden' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  useEffect(() => {
    if (!gated) return;
    const cleanup = fetchAnalytics();
    return cleanup;
  }, [gated, fetchAnalytics]);

  // Client gate: not entitled → no entry surfaced.
  if (!gated) return null;

  return (
    <section
      data-testid="educator-admin-console"
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: SURFACE_800,
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      {/* Panel header — mirrors ServerPlanPanel chrome */}
      <header
        className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon size={20} style={{ color: EMERALD }} />
            <h2
              className="text-[17px] font-semibold tracking-tight"
              style={{ color: TEXT_PRIMARY }}
            >
              Educator Console
            </h2>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase border flex items-center gap-1.5"
              style={{ backgroundColor: SURFACE_900, borderColor: HAIRLINE, color: TEXT_SECONDARY }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: EMERALD }}
                aria-hidden="true"
              />
              School Plan
            </span>
          </div>
          <p className="text-sm mt-1.5" style={{ color: TEXT_SECONDARY }}>
            Read-only aggregate metrics to monitor general server health and completion rates.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {loadStatus === 'loading' && <ConsoleSkeleton />}
        {loadStatus === 'forbidden' && <ForbiddenState />}
        {loadStatus === 'error' && <ErrorState onRetry={fetchAnalytics} />}
        {loadStatus === 'loaded' &&
          analytics &&
          (isEmptyAnalytics(analytics) ? (
            <EmptyState />
          ) : (
            <LoadedDashboard analytics={analytics} />
          ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Loaded dashboard — the four analytics groups + recent activity
// ---------------------------------------------------------------------------

function LoadedDashboard({ analytics }: { analytics: ServerAnalytics }) {
  // Members split: educators (roles whose name marks them educator/owner) vs the
  // remaining member population. We derive the educator tally from roleBreakdown
  // by matching educator-ish role names; anything else counts as students.
  const educatorCount = analytics.roleBreakdown
    .filter((r) => /educator|teacher|owner|instructor|professor|admin/i.test(r.roleName))
    .reduce((sum, r) => sum + r.memberCount, 0);
  const breakdownTotal = roleMemberSum(analytics);
  // Non-educator members = total members minus educators (never negative).
  const studentCount = Math.max(analytics.memberCount - educatorCount, 0);

  const { assignmentCount: rollupAssignments, submissionCount } = analytics.submissionRollup;

  return (
    <div className="space-y-8" data-testid="educator-console-dashboard">
      {/* 3-column equal grid — strict, low-noise stat grouping */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* MODULE 1: Membership & roles */}
        <div
          className="rounded-lg p-4 sm:p-6 flex flex-col justify-between"
          style={{
            backgroundColor: SURFACE_900,
            border: `1px solid ${HAIRLINE}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <h3
              className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: TEXT_SECONDARY }}
            >
              <UsersIcon size={15} />
              Total Members
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span
                className="text-xl font-semibold tabular-nums leading-none"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-member-count"
              >
                {NUM.format(analytics.memberCount)}
              </span>
            </div>
          </div>
          <dl
            className="grid grid-cols-2 gap-4 mt-auto pt-4"
            style={{ borderTop: `1px solid ${HAIRLINE}` }}
          >
            <div>
              <dt
                className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: TEXT_SECONDARY }}
              >
                Educators
              </dt>
              <dd
                className="text-[15px] font-medium tabular-nums"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-educator-count"
              >
                {NUM.format(educatorCount)}
              </dd>
            </div>
            <div>
              <dt
                className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: TEXT_SECONDARY }}
              >
                {breakdownTotal > 0 ? 'Students' : 'Roles'}
              </dt>
              <dd
                className="text-[15px] font-medium tabular-nums"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-student-count"
              >
                {NUM.format(breakdownTotal > 0 ? studentCount : analytics.roleBreakdown.length)}
              </dd>
            </div>
          </dl>
        </div>

        {/* MODULE 2: Communication (message volume) */}
        <div
          className="rounded-lg p-4 sm:p-6 flex flex-col justify-between"
          style={{
            backgroundColor: SURFACE_900,
            border: `1px solid ${HAIRLINE}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <h3
              className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: TEXT_SECONDARY }}
            >
              <ChatsCircleIcon size={15} />
              Messages
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span
                className="text-xl font-semibold tabular-nums leading-none"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-message-volume"
              >
                {NUM.format(analytics.messageVolume)}
              </span>
            </div>
          </div>
          <div className="mt-auto pt-4" style={{ borderTop: `1px solid ${HAIRLINE}` }}>
            <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
              Total messages sent in this server.
            </p>
          </div>
        </div>

        {/* MODULE 3: Assignments overview */}
        <div
          className="rounded-lg p-4 sm:p-6 flex flex-col justify-between"
          style={{
            backgroundColor: SURFACE_900,
            border: `1px solid ${HAIRLINE}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <div>
            <h3
              className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: TEXT_SECONDARY }}
            >
              <ClipboardTextIcon size={15} />
              Assignments Total
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span
                className="text-xl font-semibold tabular-nums leading-none"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-assignment-count"
              >
                {NUM.format(analytics.assignmentCount)}
              </span>
            </div>
          </div>
          <dl
            className="grid grid-cols-2 gap-4 mt-auto pt-4"
            style={{ borderTop: `1px solid ${HAIRLINE}` }}
          >
            <div>
              <dt
                className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: TEXT_SECONDARY }}
              >
                Graded scope
              </dt>
              <dd
                className="text-[15px] font-medium tabular-nums"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-rollup-assignments"
              >
                {NUM.format(rollupAssignments)}
              </dd>
            </div>
            <div>
              <dt
                className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: TEXT_SECONDARY }}
              >
                Submissions
              </dt>
              <dd
                className="text-[15px] font-medium tabular-nums"
                style={{ color: TEXT_PRIMARY }}
                data-testid="stat-submission-count"
              >
                {NUM.format(submissionCount)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* MODULE 4: Recent activity */}
      <div className="pt-2">
        <h3 className="text-lg font-semibold tracking-tight mb-4" style={{ color: TEXT_PRIMARY }}>
          Recent Activity
        </h3>

        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: SURFACE_900, border: `1px solid ${HAIRLINE}` }}
        >
          <ul style={{ borderColor: HAIRLINE }} data-testid="recent-activity-list">
            {analytics.recentActivity.map((bucket, i) => (
              <li
                key={bucket.type}
                className="p-4 flex items-start sm:items-center gap-4 transition-colors"
                style={i > 0 ? { borderTop: `1px solid ${HAIRLINE}` } : undefined}
              >
                <div
                  className="w-8 h-8 rounded shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: SURFACE_900, border: `1px solid ${HAIRLINE}` }}
                  aria-hidden="true"
                >
                  <ClipboardTextIcon size={15} style={{ color: TEXT_SECONDARY }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium capitalize" style={{ color: TEXT_PRIMARY }}>
                    {bucket.type.replace(/_/g, ' ')}
                  </p>
                </div>
                <div
                  className="text-sm whitespace-nowrap font-medium tabular-nums"
                  style={{ color: TEXT_SECONDARY }}
                >
                  {NUM.format(bucket.count)}
                </div>
              </li>
            ))}
          </ul>

          {/* Read-only footer — total events wired from the real payload. */}
          <div
            className="p-3 text-center"
            style={{ backgroundColor: SURFACE_900, borderTop: `1px solid ${HAIRLINE}` }}
          >
            <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
              {NUM.format(analytics.recentActivity.reduce((sum, b) => sum + b.count, 0))} recent
              events recorded.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state — every aggregate is zero
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      className="py-24 px-4 sm:px-6 text-center flex flex-col items-center justify-center"
      data-testid="educator-console-empty"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: SURFACE_900, border: '1px solid #27272a' }}
        aria-hidden="true"
      >
        <ClipboardTextIcon size={26} style={{ color: TEXT_SECONDARY }} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>
        No activity yet
      </h3>
      <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: TEXT_SECONDARY }}>
        This server is currently empty. Once students join, send messages, or submit assignments,
        your aggregate analytics will begin assembling here.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forbidden state — analytics fetch returned 403
// ---------------------------------------------------------------------------

function ForbiddenState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 px-4 sm:px-6 text-center"
      data-testid="educator-console-forbidden"
      role="alert"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(239,68,68,0.1)' }}
        aria-hidden="true"
      >
        <WarningCircleIcon size={26} style={{ color: '#f87171' }} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: '#f87171' }}>
        Access Restricted
      </h3>
      <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: TEXT_SECONDARY }}>
        The Educator Console is reserved for authorized educators on{' '}
        <strong style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>School tier</strong> servers.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state — non-403 fetch failure (retryable)
// ---------------------------------------------------------------------------

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="educator-console-error"
    >
      <WarningCircleIcon size={20} style={{ color: '#ef4444', marginBottom: 8 }} />
      <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
        Couldn&apos;t load this server&apos;s analytics.
      </p>
      <button
        type="button"
        onClick={onRetry}
        data-testid="educator-console-retry"
        className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        style={{ backgroundColor: '#27272a', color: TEXT_PRIMARY }}
      >
        Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton — subtle, non-cinematic
// ---------------------------------------------------------------------------

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`rounded ${className ?? ''}`}
      style={{ backgroundColor: '#27272a' }}
      aria-hidden="true"
    />
  );
}

function ConsoleSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading analytics"
      data-testid="educator-console-loading"
    >
      <div className="flex items-center gap-3">
        <SpinnerIcon size={16} className="animate-spin" style={{ color: TEXT_MUTED }} />
        <SkeletonBlock className="w-48 h-6" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg p-4 sm:p-6 space-y-4"
            style={{ backgroundColor: SURFACE_900, border: `1px solid ${HAIRLINE}` }}
          >
            <SkeletonBlock className="w-24 h-3" />
            <SkeletonBlock className="w-20 h-8" />
            <SkeletonBlock className="w-full h-10 mt-2" />
          </div>
        ))}
      </div>
      <div className="space-y-4 pt-4">
        <SkeletonBlock className="w-32 h-5" />
        <SkeletonBlock className="w-full h-16" />
        <SkeletonBlock className="w-[95%] h-16" />
      </div>
    </div>
  );
}
