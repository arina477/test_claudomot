/**
 * ServerPlanPanel — per-server "Your plan" panel for the server settings
 * surface. wave-75 M9 (mock freemium upgrade path), task 77665ee5.
 *
 * Behaviour:
 *   - Fetches GET /servers/:serverId/billing/plan on mount and shows the
 *     current tier name + resolved limits: storage (GB), concurrent voice
 *     (callCapacity), educator tools (on/off).
 *   - OWNER: an upgrade/downgrade affordance to pick a target tier
 *     (free / server_pro / school) and confirm, driving POST
 *     /servers/:serverId/billing/tier. On success the displayed tier + limits
 *     refresh from the returned ServerPlan WITHOUT a page reload.
 *   - NON-OWNER: read-only plan info, no affordance.
 *   - A clearly-visible MOCK / TEST checkout label — no real charge. Prices are
 *     shown for information only ($0 / $8 / $99); the confirm reads as a mock.
 *   - On a failed change (403 / 400 / network): inline error, displayed plan
 *     UNCHANGED.
 *
 * Owner determination is done by the PARENT (ServerOverviewSettings) — it
 * resolves the caller's opaque userId via getMe() and compares to the server's
 * ownerId (BUILD-PRINCIPLES rule 13: gate on the opaque id, never the
 * username). This panel receives the resolved `isOwner` as a prop.
 *
 * Chrome + tokens mirror PrivacyActivityPanel / ServerOverviewSettings —
 * DESIGN-SYSTEM.md only, dark-theme, accessible. No invented hex values.
 */

import type { ServerPlan, Tier } from '@studyhall/shared';
import { useCallback, useEffect, useState } from 'react';
import { HttpError, api } from '../auth/api';
import { CrownIcon, SpinnerIcon, WarningCircleIcon } from './icons';

// ---------------------------------------------------------------------------
// Tier presentation metadata — display name + informational price.
// Prices are informational ONLY; nothing is charged (mock checkout).
// ---------------------------------------------------------------------------

const TIER_ORDER: Tier[] = ['free', 'server_pro', 'school'];

const TIER_META: Record<Tier, { name: string; price: string }> = {
  free: { name: 'Free', price: '$0' },
  server_pro: { name: 'Server Pro', price: '$8/mo' },
  school: { name: 'School', price: '$99/mo' },
};

function tierName(tier: Tier): string {
  return TIER_META[tier]?.name ?? tier;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ServerPlanPanelProps = {
  serverId: string;
  /**
   * Whether the current caller owns this server. Resolved by the parent via
   * getMe().userId === ownerId (opaque-id comparison). Owners get the
   * upgrade/downgrade affordance; non-owners see read-only plan info.
   */
  isOwner: boolean;
};

type LoadStatus = 'loading' | 'error' | 'loaded';

// ---------------------------------------------------------------------------
// ServerPlanPanel
// ---------------------------------------------------------------------------

export function ServerPlanPanel({ serverId, isOwner }: ServerPlanPanelProps) {
  const [plan, setPlan] = useState<ServerPlan | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');

  // Selected target tier in the owner affordance (defaults to current tier).
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  const fetchPlan = useCallback(() => {
    let cancelled = false;
    setLoadStatus('loading');
    api
      .getServerPlan(serverId)
      .then((res) => {
        if (cancelled) return;
        setPlan(res);
        setSelectedTier(res.tier);
        setLoadStatus('loaded');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  useEffect(() => {
    const cleanup = fetchPlan();
    return cleanup;
  }, [fetchPlan]);

  const handleConfirm = useCallback(() => {
    if (!isOwner || !plan || selectedTier == null) return;
    if (selectedTier === plan.tier) return;
    setChanging(true);
    setChangeError(null);
    api
      .changeServerTier(serverId, selectedTier)
      .then((updated) => {
        // Refresh displayed tier + limits from the returned ServerPlan — no
        // page reload. selectedTier follows the newly-applied tier.
        setPlan(updated);
        setSelectedTier(updated.tier);
      })
      .catch((err) => {
        // Leave the displayed plan UNCHANGED; surface an inline error.
        const is403 =
          err instanceof HttpError
            ? err.status === 403
            : err instanceof Error && err.message.includes('403');
        setChangeError(
          is403
            ? 'Only the server owner can change this plan.'
            : "Couldn't switch the plan. Please try again.",
        );
      })
      .finally(() => {
        setChanging(false);
      });
  }, [isOwner, plan, selectedTier, serverId]);

  const storageGb = plan ? plan.entitlements.storageMb / 1024 : 0;
  const dirtyTier = plan != null && selectedTier != null && selectedTier !== plan.tier;
  const confirmDisabled = !dirtyTier || changing;

  return (
    <section
      data-testid="server-plan-panel"
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
          <CrownIcon size={16} />
          Your plan
        </div>
        <h3
          className="text-[17px] font-semibold leading-none"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          Server plan &amp; limits
        </h3>
        <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
          The plan that applies to this server and the limits it unlocks.
        </p>
      </header>

      {/* Body */}
      <div className="p-4 sm:p-6 flex flex-col gap-4">
        {/* Loading */}
        {loadStatus === 'loading' && (
          <div
            className="flex items-center gap-3 py-6 justify-center"
            aria-busy="true"
            aria-label="Loading plan"
            data-testid="server-plan-loading"
          >
            <SpinnerIcon
              size={16}
              className="animate-spin"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Loading plan…
            </span>
          </div>
        )}

        {/* Error loading */}
        {loadStatus === 'error' && (
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            data-testid="server-plan-load-error"
          >
            <WarningCircleIcon size={20} style={{ color: '#ef4444', marginBottom: 8 }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Couldn&apos;t load this server&apos;s plan.
            </p>
            <button
              type="button"
              onClick={fetchPlan}
              data-testid="server-plan-retry"
              className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: '#27272a', color: 'rgba(255,255,255,0.92)' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Loaded */}
        {loadStatus === 'loaded' && plan && (
          <>
            {/* Current tier + limits */}
            <div
              className="rounded-lg p-4 flex flex-col gap-3"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  Current plan
                </span>
                <span
                  data-testid="server-plan-current-tier"
                  className="text-sm font-semibold px-2.5 py-1 rounded-md"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                >
                  {tierName(plan.tier)}
                </span>
              </div>

              <dl className="flex flex-col gap-2" data-testid="server-plan-limits">
                <div className="flex items-center justify-between text-sm">
                  <dt style={{ color: 'rgba(255,255,255,0.60)' }}>Storage</dt>
                  <dd data-testid="server-plan-storage" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {storageGb} GB
                  </dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt style={{ color: 'rgba(255,255,255,0.60)' }}>Concurrent voice</dt>
                  <dd data-testid="server-plan-voice" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {plan.entitlements.callCapacity}
                  </dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt style={{ color: 'rgba(255,255,255,0.60)' }}>Educator tools</dt>
                  <dd
                    data-testid="server-plan-educator"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    {plan.entitlements.educatorAdminTools ? 'On' : 'Off'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Owner-only upgrade / downgrade affordance */}
            {isOwner && (
              <div className="flex flex-col gap-3" data-testid="server-plan-change">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  Switch plan
                </span>

                <div role="radiogroup" aria-label="Choose a plan" className="flex flex-col gap-2">
                  {TIER_ORDER.map((tier) => {
                    const active = selectedTier === tier;
                    const isCurrent = plan.tier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedTier(tier)}
                        data-testid={`server-plan-option-${tier}`}
                        className="flex items-center justify-between rounded-lg px-4 py-3 text-left transition-colors"
                        style={{
                          backgroundColor: active ? 'rgba(16,185,129,0.08)' : '#121214',
                          border: active
                            ? '1px solid rgba(16,185,129,0.40)'
                            : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <span className="flex flex-col">
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'rgba(255,255,255,0.92)' }}
                          >
                            {TIER_META[tier].name}
                            {isCurrent && (
                              <span
                                className="ml-2 text-[11px] font-normal"
                                style={{ color: 'rgba(255,255,255,0.40)' }}
                              >
                                (current)
                              </span>
                            )}
                          </span>
                          <span
                            className="text-xs mt-0.5"
                            style={{ color: 'rgba(255,255,255,0.50)' }}
                          >
                            {TIER_META[tier].price}
                          </span>
                        </span>
                        {active && (
                          <span aria-hidden="true" style={{ color: '#10b981' }}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Change error — inline, non-destructive */}
                {changeError && (
                  <div
                    className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      borderColor: 'rgba(239,68,68,0.25)',
                      color: 'rgba(255,255,255,0.80)',
                    }}
                    role="alert"
                    data-testid="server-plan-change-error"
                  >
                    <WarningCircleIcon
                      size={16}
                      style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                      aria-hidden="true"
                    />
                    {changeError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirmDisabled}
                  aria-disabled={confirmDisabled}
                  data-testid="server-plan-confirm"
                  className="flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors"
                  style={{
                    background: confirmDisabled ? '#27272a' : '#10b981',
                    color: confirmDisabled ? 'rgba(255,255,255,0.30)' : '#0a0a0b',
                    cursor: confirmDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {changing && (
                    <SpinnerIcon size={14} className="animate-spin" aria-hidden="true" />
                  )}
                  Switch plan (test mode — no charge)
                </button>

                {/* Mock-checkout disclosure */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                  data-testid="server-plan-mock-notice"
                >
                  This is a test checkout — StudyHall does not charge your card and no payment is
                  taken. Prices are shown for reference only.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
