/**
 * ProfilePage — /settings/profile
 *
 * Shows and edits display_name via GET/PATCH /profile.
 * Username, avatar, and accent controls are rendered DISABLED as
 * "coming soon" (split to wave 2a655960).
 */

import type { ProfileResponse } from '@studyhall/shared';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../auth/api';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { SubmitButton } from '../components/SubmitButton';

export function ProfilePage() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    api
      .getProfile()
      .then((data: ProfileResponse) => {
        const name = data.displayName ?? '';
        setDisplayName(name);
        setSavedName(name);
      })
      .catch(() => setLoadError('Could not load your profile. Please refresh.'))
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    setLoading(true);

    try {
      const data = await api.patchProfile({ displayName });
      const name = data.displayName ?? '';
      setSavedName(name);
      setDisplayName(name);
      setSaveSuccess(true);
    } catch {
      setSaveError('Could not save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isDirty = displayName !== (savedName ?? '');

  if (initialLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0a0a0b' }}
      >
        <span
          className="h-8 w-8 rounded-full border-2 border-current border-t-transparent sh-animate-spin"
          style={{ color: '#10b981' }}
          aria-label="Loading profile"
        />
      </div>
    );
  }

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

      <main className="mx-auto max-w-xl px-6 py-10">
        {loadError && (
          <div className="mb-6">
            <ErrorBanner message={loadError} />
          </div>
        )}

        {saveError && (
          <div className="mb-6">
            <ErrorBanner message={saveError} />
          </div>
        )}

        {saveSuccess && (
          <output
            className="mb-6 flex items-center gap-2 rounded-md p-3 text-sm"
            style={{
              backgroundColor: 'rgba(16,185,129,0.10)',
              border: '1px solid rgba(16,185,129,0.20)',
              color: '#10b981',
              display: 'flex',
            }}
          >
            <span aria-hidden="true">✓</span>
            Profile saved.
          </output>
        )}

        {/* Display name form */}
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Display name
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            This is how others see you in StudyHall.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <FormField
              id="display-name"
              label="Display name"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSaveSuccess(false);
              }}
              placeholder="Your name"
              autoComplete="name"
              maxLength={50}
            />

            <SubmitButton loading={loading} disabled={!isDirty || !displayName.trim()}>
              Save
            </SubmitButton>
          </form>
        </section>

        {/* Coming-soon sections — use spans (not labels) since controls aren't real inputs */}
        <section
          className="rounded-lg p-5 opacity-50"
          style={{
            backgroundColor: '#121214',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          aria-label="Coming soon profile options"
        >
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            Coming soon
          </p>

          <div className="flex flex-col gap-4">
            {/* Username (disabled) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Username
              </span>
              <input
                id="username-coming-soon"
                disabled
                aria-disabled="true"
                aria-label="Username — coming soon"
                placeholder="@username"
                className="h-10 w-full cursor-not-allowed rounded-md px-3 text-sm"
                style={{
                  backgroundColor: '#0a0a0b',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.30)',
                }}
              />
            </div>

            {/* Avatar (disabled) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Avatar
              </span>
              <div
                className="flex h-10 items-center rounded-md px-3 text-sm"
                style={{
                  backgroundColor: '#0a0a0b',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.30)',
                }}
                aria-label="Avatar upload — coming soon"
              >
                Upload photo — coming soon
              </div>
            </div>

            {/* Accent colour (disabled) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Accent colour
              </span>
              <div
                className="flex h-10 items-center rounded-md px-3 text-sm"
                style={{
                  backgroundColor: '#0a0a0b',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.30)',
                }}
                aria-label="Accent colour picker — coming soon"
              >
                Colour picker — coming soon
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
