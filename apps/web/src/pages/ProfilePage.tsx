/**
 * ProfilePage — /settings/profile
 *
 * Wires all three previously-disabled controls (wave 2a655960):
 *   - Username: validated `^[a-z0-9_]{3,20}$`, PATCH /profile; 409 → "taken", 400 → format error.
 *   - Avatar: file input (PNG/JPEG/WEBP ≤ 2 MB); presign → PUT → confirm flow;
 *             503 degrades gracefully ("avatar upload not available yet").
 *   - Accent color: swatch radio group; PATCH /profile {accentColor} on select.
 *
 * Display name field from wave-3 is preserved.
 */

import type { ProfileResponse } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../auth/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { useProfile } from '../shell/ProfileContext';

// ── Accent colour swatches (from settings-profile.html mockup) ───────────────

const ACCENT_COLORS = [
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#94a3b8', label: 'Slate' },
] as const;

const DEFAULT_ACCENT = '#10b981';

// ── Regex from the shared Zod schema ─────────────────────────────────────────

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

function validateUsername(value: string): string | null {
  if (value.length === 0) return null; // empty = no error shown (optional in edit)
  if (!USERNAME_RE.test(value))
    return 'Username must be 3–20 characters: lowercase letters, numbers, underscores only.';
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m || m[1] === undefined || m[2] === undefined || m[3] === undefined) {
    return { r: 16, g: 185, b: 129 };
  }
  return {
    r: Number.parseInt(m[1], 16),
    g: Number.parseInt(m[2], 16),
    b: Number.parseInt(m[3], 16),
  };
}

function applyAccentVars(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  document.documentElement.style.setProperty('--user-accent', hex);
  document.documentElement.style.setProperty('--user-accent-glow', `rgba(${r},${g},${b},0.4)`);
}

function getInitials(displayName: string | null, username: string | null): string {
  const name = displayName ?? username ?? '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();
  const { refresh: refreshShell } = useProfile();

  // ── Local form state ──────────────────────────────────────────────────────

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  // Display name
  const [displayName, setDisplayName] = useState('');
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameError, setDisplayNameError] = useState('');
  const [displayNameSuccess, setDisplayNameSuccess] = useState(false);

  // Username
  const [username, setUsername] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameClientError, setUsernameClientError] = useState<string | null>(null);
  const [usernameServerError, setUsernameServerError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Accent color
  const [accentColor, setAccentColor] = useState<string>(DEFAULT_ACCENT);
  const [accentSaving, setAccentSaving] = useState(false);
  const [accentError, setAccentError] = useState('');

  // ── Load profile ──────────────────────────────────────────────────────────

  const loadProfile = useCallback(() => {
    setInitialLoading(true);
    setLoadError('');
    api
      .getProfile()
      .then((data) => {
        applyFromProfile(data);
        setProfile(data);
      })
      .catch(() =>
        setLoadError('Could not load your profile. Check your connection and try again.'),
      )
      .finally(() => setInitialLoading(false));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadProfile is stable (useCallback with []) — intentional one-shot mount call
  useEffect(() => {
    loadProfile();
  }, []);

  function applyFromProfile(data: ProfileResponse) {
    setDisplayName(data.displayName ?? '');
    setUsername(data.username ?? '');
    setAvatarUrl(data.avatarUrl ?? null);
    const accent = data.accentColor ?? DEFAULT_ACCENT;
    setAccentColor(accent);
    applyAccentVars(accent);
  }

  // ── Derived dirty flags ───────────────────────────────────────────────────

  const displayNameDirty = displayName !== (profile?.displayName ?? '');
  const usernameDirty = username !== (profile?.username ?? '');

  // ── Display name save ─────────────────────────────────────────────────────

  async function handleDisplayNameSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setDisplayNameSaving(true);
    setDisplayNameError('');
    setDisplayNameSuccess(false);

    try {
      const updated = await api.patchProfile({ displayName: displayName.trim() });
      setProfile((p) => (p ? { ...p, displayName: updated.displayName } : p));
      setDisplayName(updated.displayName ?? '');
      setDisplayNameSuccess(true);
      refreshShell();
    } catch {
      setDisplayNameError('Could not save display name. Please try again.');
    } finally {
      setDisplayNameSaving(false);
    }
  }

  // ── Username save ─────────────────────────────────────────────────────────

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Force lowercase on input; strip disallowed chars
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(val);
    setUsernameClientError(validateUsername(val));
    setUsernameServerError('');
    setUsernameSuccess(false);
  }

  async function handleUsernameSave(e: React.FormEvent) {
    e.preventDefault();
    const err = validateUsername(username);
    if (err) {
      setUsernameClientError(err);
      return;
    }

    setUsernameSaving(true);
    setUsernameServerError('');
    setUsernameSuccess(false);

    try {
      const updated = await api.patchProfile({ username });
      setProfile((p) => (p ? { ...p, username: updated.username } : p));
      setUsername(updated.username ?? '');
      setUsernameSuccess(true);
      refreshShell();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409')) {
        setUsernameServerError('That username is already taken. Try another.');
      } else if (msg.includes('400')) {
        setUsernameServerError(
          'Username must be 3–20 characters: lowercase letters, numbers, underscores only.',
        );
      } else {
        setUsernameServerError('Could not save username. Please try again.');
      }
    } finally {
      setUsernameSaving(false);
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client pre-checks
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be smaller than 2 MB.');
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarError('Only PNG, JPEG, and WEBP images are supported.');
      return;
    }

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarError('');
    setAvatarUploading(true);

    try {
      let presign: { uploadUrl: string; key: string };
      try {
        presign = await api.presignAvatar(file.type);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('503')) {
          setAvatarError('Avatar upload is not available yet. Other profile settings still work.');
          setAvatarPreview(null);
          return;
        }
        throw err;
      }

      await api.putAvatarToStorage(presign.uploadUrl, file);
      const updated = await api.confirmAvatar(presign.key);
      setAvatarUrl(updated.avatarUrl ?? null);
      setAvatarPreview(null); // use confirmed URL now
      setProfile((p) => (p ? { ...p, avatarUrl: updated.avatarUrl } : p));
      refreshShell();
    } catch {
      setAvatarPreview(null);
      setAvatarError('Avatar upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
      // Reset file input so the same file can be re-selected after an error
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  // ── Accent color select ───────────────────────────────────────────────────

  async function handleAccentSelect(hex: string) {
    setAccentColor(hex);
    applyAccentVars(hex);
    setAccentError('');
    setAccentSaving(true);

    try {
      const updated = await api.patchProfile({ accentColor: hex });
      setProfile((p) => (p ? { ...p, accentColor: updated.accentColor } : p));
      refreshShell();
    } catch {
      setAccentError('Could not save accent colour. Please try again.');
    } finally {
      setAccentSaving(false);
    }
  }

  // ── Loading skeleton — §113: skeleton rows (surface-700 shimmer) ────────────

  if (initialLoading) {
    return (
      <div className="min-h-screen animate-pulse" style={{ backgroundColor: '#0a0a0b' }}>
        {/* Header skeleton */}
        <div
          className="flex h-14 items-center border-b px-6"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          aria-hidden="true"
        >
          <div className="h-4 w-36 rounded-md" style={{ backgroundColor: '#27272a' }} />
        </div>
        <div className="mx-auto max-w-2xl px-6 py-10" aria-busy="true" aria-label="Loading profile">
          {/* Avatar section */}
          <div className="mb-10 flex items-center gap-6">
            <div
              className="h-20 w-20 shrink-0 rounded-full"
              style={{ backgroundColor: '#27272a' }}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-3">
              <div className="h-4 w-32 rounded-md" style={{ backgroundColor: '#27272a' }} />
              <div className="h-3 w-48 rounded-md" style={{ backgroundColor: '#1c1c1f' }} />
              <div className="h-3 w-20 rounded-md" style={{ backgroundColor: '#27272a' }} />
            </div>
          </div>
          <div
            className="mb-10 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            aria-hidden="true"
          />
          {/* Form section skeleton (display name + username) */}
          {[0, 1].map((i) => (
            <div key={i} className="mb-10">
              <div
                className="mb-4 h-[10px] w-24 rounded-md"
                style={{ backgroundColor: '#3f3f46' }}
                aria-hidden="true"
              />
              <div
                className="mb-5 h-3 w-64 rounded-md"
                style={{ backgroundColor: '#27272a' }}
                aria-hidden="true"
              />
              <div
                className="h-10 w-full rounded-md"
                style={{ backgroundColor: '#27272a' }}
                aria-hidden="true"
              />
              <div
                className="mt-4 h-8 w-16 rounded-md"
                style={{ backgroundColor: '#27272a' }}
                aria-hidden="true"
              />
              {i < 1 && (
                <div
                  className="mt-10 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayAvatarSrc = avatarPreview ?? avatarUrl;
  const initials = getInitials(displayName, username);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0a0a0b', color: 'rgba(255,255,255,0.92)' }}
    >
      {/* Header */}
      <header
        className="flex h-14 items-center border-b px-6"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <h1 className="text-base font-semibold">Settings — Profile</h1>
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="ml-auto text-sm transition-colors hover:opacity-90 focus-visible:outline-none"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Go to app
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {loadError && (
          <div className="mb-6">
            <ErrorBanner message={loadError} />
            {/* §113 retry affordance for the profile load error */}
            <button
              type="button"
              onClick={loadProfile}
              className="mt-3 flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              style={{
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.30)',
                color: '#f87171',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'rgba(239,68,68,0.14)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'rgba(239,68,68,0.08)';
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Avatar section ─────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Avatar
          </h2>

          <div className="flex items-center gap-6">
            {/* Avatar preview */}
            <button
              type="button"
              aria-label="Change avatar — click to upload"
              className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 group"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              <div
                className="w-20 h-20 rounded-full overflow-hidden border flex items-center justify-center text-xl font-semibold"
                style={{
                  backgroundColor: '#1c1c1f',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: accentColor,
                }}
              >
                {displayAvatarSrc ? (
                  <img
                    src={displayAvatarSrc}
                    alt="Your avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">{initials}</span>
                )}
              </div>

              {/* Hover/uploading overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full flex items-center justify-center text-xs font-semibold uppercase tracking-wider transition-opacity duration-200"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.60)',
                  opacity: avatarUploading ? 1 : 0,
                  color: '#fff',
                }}
              >
                {avatarUploading ? '…' : 'Change'}
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full flex items-center justify-center text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: 'rgba(0,0,0,0.60)', color: '#fff' }}
              >
                {!avatarUploading && 'Change'}
              </div>
            </button>

            {/* Upload button + status */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Upload a custom avatar
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
                PNG, JPEG, or WEBP. Max 2 MB.
              </p>

              <button
                type="button"
                className="text-sm font-medium hover:underline text-left focus-visible:outline-none"
                style={{ color: accentColor }}
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-busy={avatarUploading}
              >
                {avatarUploading ? 'Uploading…' : 'Choose file…'}
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Avatar file upload"
                onChange={handleAvatarSelect}
              />

              {avatarError && (
                <p role="alert" className="text-xs" style={{ color: '#ef4444' }}>
                  {avatarError}
                </p>
              )}
            </div>
          </div>
        </section>

        <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} className="mb-10" />

        {/* ── Display name section ────────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Display name
          </h2>
          <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            This is how others see you in StudyHall.
          </p>

          {displayNameError && (
            <div className="mb-4">
              <ErrorBanner message={displayNameError} />
            </div>
          )}

          {displayNameSuccess && (
            <output
              className="mb-4 flex items-center gap-2 rounded-md p-3 text-sm"
              style={{
                backgroundColor: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.20)',
                color: '#10b981',
                display: 'flex',
              }}
            >
              <span aria-hidden="true">✓</span>
              Display name saved.
            </output>
          )}

          <form onSubmit={handleDisplayNameSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="display-name"
                className="text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setDisplayNameSuccess(false);
                }}
                placeholder="Your name"
                autoComplete="name"
                maxLength={50}
                className="h-10 w-full rounded-md px-3 text-sm focus:outline-none"
                style={{
                  backgroundColor: '#121214',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.92)',
                }}
                onFocus={(e) => {
                  const { r, g, b } = hexToRgb(accentColor);
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.boxShadow = `0 0 0 2px rgba(${r},${g},${b},0.4)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = '';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={displayNameSaving || !displayNameDirty || !displayName.trim()}
              aria-busy={displayNameSaving}
              className="self-start rounded-md px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
              style={{ backgroundColor: accentColor, color: '#fff' }}
            >
              {displayNameSaving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </section>

        <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} className="mb-10" />

        {/* ── Username section ────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Username
          </h2>

          <form onSubmit={handleUsernameSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                Username
              </label>

              <div className="relative flex items-center">
                <span
                  className="absolute left-3 select-none font-mono text-sm"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                  aria-hidden="true"
                >
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="your_handle"
                  autoComplete="username"
                  maxLength={20}
                  spellCheck={false}
                  aria-invalid={!!(usernameClientError || usernameServerError)}
                  aria-describedby={
                    usernameClientError || usernameServerError ? 'username-error' : 'username-hint'
                  }
                  className="h-10 w-full rounded-md pl-8 pr-3 font-mono text-sm focus:outline-none"
                  style={{
                    backgroundColor: '#121214',
                    border: `1px solid ${usernameClientError || usernameServerError ? '#ef4444' : 'rgba(255,255,255,0.06)'}`,
                    color: 'rgba(255,255,255,0.92)',
                  }}
                  onFocus={(e) => {
                    if (!usernameClientError && !usernameServerError) {
                      e.currentTarget.style.borderColor = accentColor;
                      const { r, g, b } = hexToRgb(accentColor);
                      e.currentTarget.style.boxShadow = `0 0 0 2px rgba(${r},${g},${b},0.4)`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!usernameClientError && !usernameServerError) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                />
              </div>

              {usernameClientError || usernameServerError ? (
                <p
                  id="username-error"
                  role="alert"
                  className="text-xs"
                  style={{ color: '#ef4444' }}
                >
                  {usernameClientError ?? usernameServerError}
                </p>
              ) : (
                <p
                  id="username-hint"
                  className="text-xs"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  Unique across StudyHall. 3–20 characters: lowercase letters, numbers, underscores.
                </p>
              )}

              {usernameSuccess && !usernameServerError && (
                <p className="text-xs" style={{ color: '#10b981' }}>
                  ✓ Username saved.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={usernameSaving || !usernameDirty || !username || !!usernameClientError}
              aria-busy={usernameSaving}
              className="self-start rounded-md px-5 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
              style={{ backgroundColor: accentColor, color: '#fff' }}
            >
              {usernameSaving ? 'Saving…' : 'Save username'}
            </button>
          </form>
        </section>

        <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} className="mb-10" />

        {/* ── Accent colour section ───────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Accent colour
          </h2>
          <p className="mb-5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Used for buttons, links, and your profile card identity.
          </p>

          <div role="radiogroup" aria-label="Choose accent colour" className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map(({ hex, label }) => {
              const isActive = accentColor === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={label}
                  disabled={accentSaving}
                  onClick={() => handleAccentSelect(hex)}
                  className="w-7 h-7 rounded-full shrink-0 focus-visible:outline-none transition-transform"
                  style={{
                    backgroundColor: hex,
                    border: isActive ? '3px solid white' : '3px solid transparent',
                    transform: isActive ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: isActive ? '0 0 0 1px rgba(255,255,255,0.3)' : 'none',
                    opacity: accentSaving ? 0.7 : 1,
                  }}
                />
              );
            })}
          </div>

          {accentError && (
            <p role="alert" className="mt-3 text-xs" style={{ color: '#ef4444' }}>
              {accentError}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
