/**
 * ServerOverviewSettings — Overview/General settings surface for a server.
 *
 * Design: design/server-settings.html Overview tab shell (nav/tab layout,
 * card styling). Reuses the settings full-screen overlay chrome established
 * by ServerRolesPage.
 *
 * Features:
 *   - Publish toggle (is_public) — OWNER-ONLY, dark-on-emerald when on.
 *   - Description textarea (≤ 500 chars).
 *   - Topic input (≤ 100 chars).
 *   - Save → PATCH /servers/:id; reflects new state optimistically.
 *   - Errors surface non-destructively (inline error banner, no state loss).
 *
 * Owner gate: isOwner = currentUserId === ownerId, mirroring ServerRolesPage:675.
 * Non-owners see description/topic READ-ONLY (fields disabled, no Save/Discard).
 * The publish toggle is hidden from non-owners entirely.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HttpError, api } from '../auth/api';
import { GearIcon, ShieldCheckIcon, SpinnerIcon, WarningCircleIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServerOverviewSettingsProps = {
  serverId: string;
  serverName: string;
  /** ownerId of the server — used for owner gate. */
  ownerId: string;
  onClose: () => void;
  /** Optional: navigate to the Roles tab. */
  onGoToRoles?: () => void;
  /** Current server values — used to pre-populate fields so an open does not clobber real state. */
  initialIsPublic?: boolean;
  initialDescription?: string | null;
  initialTopic?: string | null;
  /**
   * Called after a successful save so the parent can refresh selectedDetail.
   * If omitted the component still saves, but the context won't refresh.
   */
  onSaveSuccess?: () => void;
};

type SaveStatus = 'idle' | 'saving' | 'error';

/** Distinguishes "still resolving getMe" from "resolved non-owner". */
type OwnerStatus = 'loading' | 'owner' | 'non-owner' | 'error';

type Toast = { id: string; message: string; kind: 'success' | 'error' };

// ---------------------------------------------------------------------------
// Toast hook — mirrors ServerRolesPage
// ---------------------------------------------------------------------------

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, kind: Toast['kind']) => {
    const id = String(Date.now());
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);
  return { toasts, addToast };
}

// ---------------------------------------------------------------------------
// Toggle switch — DS §8 dark-on-emerald when on
// ---------------------------------------------------------------------------

type ToggleProps = {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  'aria-describedby'?: string;
};

function Toggle({ id, checked, onChange, disabled, 'aria-describedby': describedBy }: ToggleProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: checked ? '#10b981' : '#3f3f46',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        // DS focus ring
        ['--tw-ring-color' as string]: 'rgba(16,185,129,0.5)',
        ['--tw-ring-offset-color' as string]: '#0a0a0b',
      }}
      data-testid={`toggle-${id}`}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full shadow-md transition-transform duration-200"
        style={{
          backgroundColor: '#ffffff',
          transform: checked ? 'translateX(1.375rem)' : 'translateX(0.25rem)',
        }}
        aria-hidden="true"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServerOverviewSettings({
  serverId,
  serverName,
  ownerId,
  onClose,
  onGoToRoles,
  initialIsPublic = false,
  initialDescription = null,
  initialTopic = null,
  onSaveSuccess,
}: ServerOverviewSettingsProps) {
  // Fix 3: distinguish loading from resolved-non-owner; surface error rather
  // than silently hiding the owner surface on a getMe blip.
  const [ownerStatus, setOwnerStatus] = useState<OwnerStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    setOwnerStatus('loading');
    api
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setOwnerStatus(me.userId === ownerId ? 'owner' : 'non-owner');
      })
      .catch(() => {
        if (cancelled) return;
        setOwnerStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const isOwner = ownerStatus === 'owner';

  // ── Save / error state ───────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // ── Field state — pre-populated from current server values ───────────────
  // null description/topic → empty string in the field (display as blank),
  // but Discard restores to the original initial value so a null stays null on save.
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [topic, setTopic] = useState(initialTopic ?? '');

  // Fix 2: Track the saved baseline separately from the prop so Discard and
  // "did this field change?" comparisons always compare against what was last
  // persisted — not what was passed in at mount time (which goes stale after
  // the first successful save without a context refresh).
  const [baselineIsPublic, setBaselineIsPublic] = useState(initialIsPublic);
  const [baselineDescription, setBaselineDescription] = useState(initialDescription ?? '');
  const [baselineTopic, setBaselineTopic] = useState(initialTopic ?? '');

  // Reset field state whenever the target server changes (e.g. user switches
  // servers while the panel is open, or the panel remounts for a new server).
  // Intentionally scoped to serverId only — initialIsPublic/Description/Topic
  // are the values at mount time for that server; re-running on every prop
  // change would clobber in-progress edits on a background detail refresh.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on server identity, not value drift
  useEffect(() => {
    setIsPublic(initialIsPublic);
    setDescription(initialDescription ?? '');
    setTopic(initialTopic ?? '');
    setBaselineIsPublic(initialIsPublic);
    setBaselineDescription(initialDescription ?? '');
    setBaselineTopic(initialTopic ?? '');
    setDirty(false);
    setSaveStatus('idle');
    setSaveError(null);
  }, [serverId]);

  const { toasts, addToast } = useToasts();

  // ── Motion pref (a11y) ───────────────────────────────────────────────────
  const motionOk = useRef(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true,
  );

  // ── Keyboard close ───────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handlePublicChange(v: boolean) {
    setIsPublic(v);
    setDirty(true);
  }

  function handleDescriptionChange(v: string) {
    setDescription(v);
    setDirty(true);
  }

  function handleTopicChange(v: string) {
    setTopic(v);
    setDirty(true);
  }

  async function handleSave() {
    if (!dirty) return;
    setSaveStatus('saving');
    setSaveError(null);

    // Fix 5: partial patch — only include fields that actually changed from the
    // saved baseline. This avoids touching unrelated columns and prevents
    // whitespace-trimming unedited fields.
    const patch: import('@studyhall/shared').UpdateServer = {};
    if (isOwner && isPublic !== baselineIsPublic) {
      patch.is_public = isPublic;
    }
    const trimmedDescription = description.trim() || null;
    const trimmedTopic = topic.trim() || null;
    if (trimmedDescription !== (baselineDescription.trim() || null)) {
      patch.description = trimmedDescription;
    }
    if (trimmedTopic !== (baselineTopic.trim() || null)) {
      patch.topic = trimmedTopic;
    }

    // If nothing actually changed (e.g. owner toggled publish twice back to original),
    // treat as a no-op save.
    if (Object.keys(patch).length === 0) {
      setDirty(false);
      setSaveStatus('idle');
      return;
    }

    try {
      await api.updateServer(serverId, patch);

      // Fix 2: update the saved baseline to match what we just sent so:
      //   (a) Discard from here would restore to the just-saved values, and
      //   (b) the next partial-diff compares against the current persisted state.
      if (patch.is_public !== undefined) setBaselineIsPublic(patch.is_public);
      if (patch.description !== undefined) setBaselineDescription(description.trim());
      if (patch.topic !== undefined) setBaselineTopic(topic.trim());

      setDirty(false);
      setSaveStatus('idle');
      addToast('Server overview saved.', 'success');

      // Fix 2: refresh the server detail in context so selectedDetail reflects
      // the new is_public/description/topic on re-open (no stale revert).
      onSaveSuccess?.();
    } catch (err) {
      // Fix 4: key off HttpError.status first; fall back to message string parse.
      const is403 =
        err instanceof HttpError
          ? err.status === 403
          : err instanceof Error && err.message.includes('403');
      if (is403) {
        setSaveStatus('error');
        setSaveError('Only the server owner can update overview settings.');
        addToast('Permission denied.', 'error');
      } else {
        const msg = err instanceof Error ? err.message : 'Save failed';
        setSaveStatus('error');
        setSaveError(msg);
        addToast(msg, 'error');
      }
    }
  }

  function handleDiscard() {
    // Fix 2: discard to the saved baseline (not the mount-time initial*).
    setIsPublic(baselineIsPublic);
    setDescription(baselineDescription);
    setTopic(baselineTopic);
    setDirty(false);
    setSaveStatus('idle');
    setSaveError(null);
  }

  const descriptionOverLimit = description.length > 500;
  const topicOverLimit = topic.length > 100;
  // Fix 1: non-owners cannot save; the Save button is hidden entirely for them.
  const canSave =
    isOwner && dirty && !descriptionOverLimit && !topicOverLimit && saveStatus !== 'saving';

  return (
    <>
      {/* Toast region */}
      <section
        className="pointer-events-none fixed right-6 top-6 z-[60] flex flex-col gap-3"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <output
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-sm font-medium"
            style={{
              background: t.kind === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              borderColor: t.kind === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
              color: 'rgba(255,255,255,0.92)',
              ...(motionOk.current ? { animation: 'fadeIn 0.2s ease forwards' } : {}),
            }}
          >
            {t.kind === 'success' ? (
              <span style={{ color: '#10b981' }} aria-hidden="true">
                ✓
              </span>
            ) : (
              <span style={{ color: '#ef4444' }} aria-hidden="true">
                ✕
              </span>
            )}
            {t.message}
          </output>
        ))}
      </section>

      {/* Full-screen settings shell — mirrors ServerRolesPage chrome */}
      <div
        className="fixed inset-0 z-40 flex"
        style={{ background: '#0a0a0b' }}
        role="dialog"
        aria-modal="true"
        aria-label={`${serverName} — Server Overview Settings`}
        data-testid="server-overview-settings"
      >
        {/* Settings nav sidebar */}
        <aside
          className="flex w-full shrink-0 flex-col lg:h-[100dvh] lg:w-60"
          style={{
            background: '#121214',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Server header */}
          <div
            className="flex h-16 shrink-0 items-center gap-3 border-b p-4"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{ background: '#1c1c1f', borderColor: 'rgba(255,255,255,0.10)' }}
              aria-hidden="true"
            >
              <GearIcon size={20} style={{ color: 'rgba(255,255,255,0.60)' }} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2
                className="truncate text-sm font-semibold leading-tight"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {serverName}
              </h2>
              <span
                className="mt-0.5 text-xs font-medium"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                Server Settings
              </span>
            </div>
          </div>

          {/* Nav entries */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Settings sections">
            {/* Overview — active */}
            <a
              href="#overview-content"
              className="relative flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium transition-all"
              style={{ color: '#10b981', background: 'rgba(16,185,129,0.10)' }}
              aria-current="page"
            >
              <div
                className="absolute left-0 top-1/2 h-3/5 w-1 -translate-y-1/2 rounded-r-full"
                style={{ background: '#10b981' }}
                aria-hidden="true"
              />
              <GearIcon size={18} />
              Overview
            </a>

            {/* Roles — inactive link */}
            {onGoToRoles && (
              <button
                type="button"
                onClick={onGoToRoles}
                className="flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.60)' }}
              >
                <ShieldCheckIcon size={18} />
                Roles
              </button>
            )}
          </nav>

          {/* Bottom user info */}
          <div
            className="mt-auto flex shrink-0 items-center gap-3 border-t p-4"
            style={{ background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border"
              style={{ background: '#27272a', borderColor: 'rgba(255,255,255,0.05)' }}
              aria-hidden="true"
            >
              {/* Fix 3: render a neutral indicator while loading so the owner doesn't flash "ME" */}
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {ownerStatus === 'loading' ? '…' : isOwner ? 'OW' : 'ME'}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {ownerStatus === 'loading' ? '' : isOwner ? 'Owner' : 'Member'}
            </span>
          </div>
        </aside>

        {/* Main content */}
        <main
          id="overview-content"
          className="flex h-[100dvh] flex-1 flex-col overflow-hidden"
          style={{ background: '#0a0a0b' }}
        >
          {/* Header */}
          <header
            className="flex h-16 shrink-0 items-center justify-between border-b px-6"
            style={{
              background: 'rgba(10,10,11,0.90)',
              borderColor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <h1 className="text-lg font-semibold tracking-tight text-white">Overview</h1>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Settings"
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              <XIcon size={18} />
            </button>
          </header>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-16">
              {/* Fix 3: getMe error banner — owner gating failed, don't silently lock out */}
              {ownerStatus === 'error' && (
                <div
                  className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.25)',
                    color: 'rgba(255,255,255,0.80)',
                  }}
                  role="alert"
                  data-testid="getme-error"
                >
                  <WarningCircleIcon
                    size={16}
                    style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                    aria-hidden="true"
                  />
                  Could not verify your identity. Please reload to retry.
                </div>
              )}

              {/* Inline error banner */}
              {saveStatus === 'error' && saveError && (
                <div
                  className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.25)',
                    color: 'rgba(255,255,255,0.80)',
                  }}
                  role="alert"
                  data-testid="overview-save-error"
                >
                  <WarningCircleIcon
                    size={16}
                    style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                    aria-hidden="true"
                  />
                  {saveError}
                </div>
              )}

              {/* Directory Visibility card — owner-only (Fix 1: still owner-only) */}
              {isOwner && (
                <section
                  className="rounded-xl border p-6"
                  style={{
                    background: '#121214',
                    borderColor: 'rgba(255,255,255,0.06)',
                    boxShadow:
                      '0 4px 24px -1px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)',
                  }}
                  data-testid="publish-section"
                >
                  <h2
                    className="mb-1 text-sm font-semibold"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    Public directory
                  </h2>
                  <p
                    className="mb-4 text-[13px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                  >
                    List this server in the public discovery directory so anyone can find and join
                    it. Members already in the server are unaffected.
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <label
                        htmlFor="publish-toggle"
                        className="text-sm font-medium"
                        style={{ color: 'rgba(255,255,255,0.80)' }}
                      >
                        List in public directory
                      </label>
                      <p
                        id="publish-toggle-hint"
                        className="mt-0.5 text-xs"
                        style={{ color: 'rgba(255,255,255,0.40)' }}
                      >
                        {isPublic
                          ? 'Visible in directory — anyone can discover and join.'
                          : 'Private — only invite-link members can join.'}
                      </p>
                    </div>
                    <Toggle
                      id="publish-toggle"
                      checked={isPublic}
                      onChange={handlePublicChange}
                      aria-describedby="publish-toggle-hint"
                    />
                  </div>
                </section>
              )}

              {/* Description + Topic card
                  Fix 1: fields are disabled for non-owners; the entire editing surface
                  (including Save/Discard) is gated on isOwner. */}
              <section
                className="rounded-xl border p-6"
                style={{
                  background: '#121214',
                  borderColor: 'rgba(255,255,255,0.06)',
                  boxShadow:
                    '0 4px 24px -1px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)',
                }}
              >
                <h2
                  className="mb-4 text-sm font-semibold"
                  style={{ color: 'rgba(255,255,255,0.92)' }}
                >
                  Server profile
                </h2>

                {/* Description */}
                <div className="mb-5">
                  <label
                    htmlFor="server-description"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    Description
                  </label>
                  <textarea
                    id="server-description"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe your server for the public directory…"
                    rows={4}
                    maxLength={510}
                    // Fix 1: disabled for non-owners so the field is read-only
                    disabled={!isOwner}
                    className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500/60 focus:ring-1"
                    style={{
                      background: '#1c1c1f',
                      borderColor: descriptionOverLimit ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.92)',
                      cursor: !isOwner ? 'default' : undefined,
                      opacity: !isOwner && ownerStatus !== 'loading' ? 0.6 : undefined,
                      ['--tw-ring-color' as string]: 'rgba(16,185,129,0.3)',
                    }}
                    data-testid="description-input"
                    aria-describedby="description-counter"
                    aria-readonly={!isOwner}
                  />
                  <p
                    id="description-counter"
                    className="mt-1 text-right text-[11px]"
                    style={{
                      color: descriptionOverLimit ? '#ef4444' : 'rgba(255,255,255,0.30)',
                    }}
                    aria-live="polite"
                  >
                    {description.length} / 500
                  </p>
                </div>

                {/* Topic */}
                <div>
                  <label
                    htmlFor="server-topic"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    Topic
                  </label>
                  <input
                    id="server-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    placeholder="e.g. Physics, Study Group, CS 101…"
                    maxLength={110}
                    // Fix 1: disabled for non-owners so the field is read-only
                    disabled={!isOwner}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500/60 focus:ring-1"
                    style={{
                      background: '#1c1c1f',
                      borderColor: topicOverLimit ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.92)',
                      cursor: !isOwner ? 'default' : undefined,
                      opacity: !isOwner && ownerStatus !== 'loading' ? 0.6 : undefined,
                      ['--tw-ring-color' as string]: 'rgba(16,185,129,0.3)',
                    }}
                    data-testid="topic-input"
                    aria-describedby="topic-counter"
                    aria-readonly={!isOwner}
                  />
                  <p
                    id="topic-counter"
                    className="mt-1 text-right text-[11px]"
                    style={{
                      color: topicOverLimit ? '#ef4444' : 'rgba(255,255,255,0.30)',
                    }}
                    aria-live="polite"
                  >
                    {topic.length} / 100
                  </p>
                </div>
              </section>

              {/* Fix 1: Save / Discard actions — OWNER-ONLY.
                  Non-owners do not see these buttons at all. */}
              {isOwner && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={!canSave}
                    aria-disabled={!canSave}
                    className="flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors"
                    style={{
                      background: canSave ? '#10b981' : '#27272a',
                      color: canSave ? '#0a0a0b' : 'rgba(255,255,255,0.30)',
                      cursor: canSave ? 'pointer' : 'not-allowed',
                    }}
                    data-testid="save-btn"
                  >
                    {saveStatus === 'saving' && (
                      <SpinnerIcon size={14} className="animate-spin" aria-hidden="true" />
                    )}
                    Save Changes
                  </button>

                  {dirty && (
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-white/5"
                      style={{ color: 'rgba(255,255,255,0.50)' }}
                      data-testid="discard-btn"
                    >
                      Discard
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
