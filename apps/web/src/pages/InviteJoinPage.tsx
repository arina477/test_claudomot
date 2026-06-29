/**
 * InviteJoinPage — public landing page at /invite/:code.
 *
 * 8 states per design/invite-join.html:
 *   loading      — fetching GET /invites/:code skeleton
 *   valid        — authenticated + verified user can join
 *   unauthed     — no session; shows sign-up / log-in CTAs
 *   unverified   — session exists but email not verified; resend flow
 *   already-member — user is already in this server; go-to-server
 *   joining      — POST /invites/:code/join in flight
 *   joined       — success; brief feedback before redirect
 *   invalid      — 404 from API (expired / revoked / maxed)
 *
 * Preview (GET /invites/:code) is public — no auth needed.
 * Join (POST /invites/:code/join) requires auth + verified email.
 *
 * Login-return flow: unauthed users are sent to /login?next=/invite/:code
 * so they land back here after login.
 *
 * After a successful join, ServerContext.refetch() is called and the user
 * is navigated to /app with the new serverId stored in sessionStorage so
 * the shell can auto-select it.
 */

import type { InvitePreview } from '@studyhall/shared';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sendVerificationEmail } from 'supertokens-auth-react/recipe/emailverification';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { api } from '../auth/api';
import {
  ArrowRightIcon,
  BooksIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  SealCheckIcon,
  SpinnerIcon,
  UsersIcon,
  WarningCircleIcon,
} from '../shell/icons';

type PageState =
  | 'loading'
  | 'invalid'
  | 'unauthed'
  | 'unverified'
  | 'already-member'
  | 'valid'
  | 'joining'
  | 'joined';

// Shared card wrapper — full-page centred layout matching design spec.
function InviteCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-dvh w-full flex items-start justify-center pt-20 px-4"
      style={{ backgroundColor: '#0a0a0b' }}
    >
      <div
        className="w-full overflow-hidden"
        style={{
          maxWidth: 440,
          backgroundColor: '#121214',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Shared server preview block (icon + name + member count).
function ServerPreview({
  name,
  memberCount,
  dimmed = false,
}: {
  name: string;
  memberCount: number;
  dimmed?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center pt-8 pb-4 px-8 gap-4"
      style={{ opacity: dimmed ? 0.6 : 1 }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: '#27272a',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
        aria-label={`Server icon: ${name}`}
      >
        <BooksIcon size={28} className="" style={{ color: '#10b981' }} />
      </div>

      <div className="text-center">
        <h1
          className="text-2xl font-semibold tracking-tight leading-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {name}
        </h1>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <UsersIcon size={14} style={{ color: 'rgba(255,255,255,0.60)' }} />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
            {memberCount.toLocaleString()} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Divider + action area at the bottom of the card.
function ActionArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-8 pb-6 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {children}
    </div>
  );
}

// ── State: loading ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <InviteCard>
      <div className="flex flex-col items-center pt-8 pb-6 px-8 gap-5">
        <div
          className="w-16 h-16 rounded-full relative overflow-hidden"
          style={{ backgroundColor: '#27272a' }}
          aria-label="Loading server preview"
          aria-live="polite"
        >
          <SkeletonShimmer />
        </div>
        <div className="w-full flex flex-col items-center gap-2">
          <div
            className="h-6 w-48 rounded-md relative overflow-hidden"
            style={{ backgroundColor: '#27272a' }}
          >
            <SkeletonShimmer />
          </div>
          <div
            className="h-4 w-28 rounded-md relative overflow-hidden"
            style={{ backgroundColor: '#27272a' }}
          >
            <SkeletonShimmer />
          </div>
        </div>
        <div
          className="h-10 w-full rounded-md mt-2 relative overflow-hidden"
          style={{ backgroundColor: '#27272a' }}
        >
          <SkeletonShimmer />
        </div>
      </div>
    </InviteCard>
  );
}

function SkeletonShimmer() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        animation: 'shimmer 1.6s infinite',
      }}
    />
  );
}

// ── State: invalid ────────────────────────────────────────────────────────────

function InvalidState() {
  const navigate = useNavigate();
  return (
    <InviteCard>
      <div className="flex flex-col items-center pt-8 pb-6 px-8 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          role="alert"
          aria-live="assertive"
          style={{
            backgroundColor: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.30)',
          }}
        >
          <WarningCircleIcon size={32} style={{ color: '#ef4444' }} />
        </div>

        <div className="text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Link unavailable
          </h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
            This invite link has expired, been revoked, or reached its maximum uses. Ask the server
            owner for a new link.
          </p>
        </div>

        <div className="w-full pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.92)',
              boxShadow: '0 0 0 0 transparent',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
            }}
          >
            Return to app
          </button>
        </div>
      </div>
    </InviteCard>
  );
}

// ── State: unauthed ───────────────────────────────────────────────────────────

function UnauthedState({ code }: { code: string }) {
  const navigate = useNavigate();
  const returnPath = `/invite/${code}`;

  return (
    <InviteCard>
      <div className="flex flex-col items-center pt-8 pb-0 px-8 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: '#27272a',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <BooksIcon size={28} style={{ color: '#10b981' }} />
        </div>
        <div className="text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            You've been invited!
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Create an account or log in to join this server.
          </p>
        </div>
      </div>

      <ActionArea>
        <button
          type="button"
          onClick={() => navigate(`/signup?next=${encodeURIComponent(returnPath)}`)}
          className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none"
          style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
        >
          Sign up to join
        </button>
        <button
          type="button"
          onClick={() => navigate(`/login?next=${encodeURIComponent(returnPath)}`)}
          className="w-full rounded-md px-4 py-2 text-sm font-medium mt-2 transition-colors focus-visible:outline-none"
          style={{
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          Log in
        </button>
      </ActionArea>
    </InviteCard>
  );
}

// ── State: unverified ─────────────────────────────────────────────────────────

function UnverifiedState({ preview }: { preview: InvitePreview }) {
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleResend() {
    setSendState('sending');
    try {
      await sendVerificationEmail();
      setSendState('sent');
    } catch {
      setSendState('error');
    }
  }

  return (
    <InviteCard>
      <ServerPreview name={preview.server.name} memberCount={preview.server.memberCount} />

      <div className="px-8 py-3">
        <div
          className="w-full rounded-md px-4 py-3 flex items-start gap-3"
          aria-live="polite"
          style={{
            backgroundColor: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.30)',
          }}
        >
          <SealCheckIcon size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Verify your email to join
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Check your inbox and confirm your email address. Join will unlock once your account is
              verified.
            </p>
          </div>
        </div>
      </div>

      <ActionArea>
        {sendState === 'sent' && (
          <p className="text-xs text-center mb-2" style={{ color: '#10b981' }} aria-live="polite">
            Verification email sent! Check your inbox.
          </p>
        )}
        {sendState === 'error' && (
          <p className="text-xs text-center mb-2" style={{ color: '#ef4444' }} role="alert">
            Failed to send email. Please try again.
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={sendState === 'sending' || sendState === 'sent'}
          className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:outline-none"
          style={{
            backgroundColor: '#27272a',
            color:
              sendState === 'sending' || sendState === 'sent'
                ? 'rgba(255,255,255,0.40)'
                : 'rgba(255,255,255,0.92)',
            cursor: sendState === 'sending' || sendState === 'sent' ? 'not-allowed' : 'pointer',
          }}
        >
          {sendState === 'sending' ? (
            <SpinnerIcon size={16} className="animate-spin" />
          ) : (
            <EnvelopeIcon size={16} />
          )}
          {sendState === 'sent' ? 'Email sent' : 'Resend verification email'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full rounded-md px-4 py-2 text-sm font-medium mt-2 transition-colors focus-visible:outline-none"
          style={{ color: 'rgba(255,255,255,0.60)', backgroundColor: 'transparent' }}
        >
          Cancel
        </button>
      </ActionArea>
    </InviteCard>
  );
}

// ── State: already-member ─────────────────────────────────────────────────────

function AlreadyMemberState({
  preview,
  serverId,
}: {
  preview: InvitePreview;
  serverId: string;
}) {
  const navigate = useNavigate();

  function goToServer() {
    sessionStorage.setItem('sh:select-server', serverId);
    navigate('/app');
  }

  return (
    <InviteCard>
      <ServerPreview name={preview.server.name} memberCount={preview.server.memberCount} />
      <ActionArea>
        <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>
          You&apos;re already a member of this server.
        </p>
        <button
          type="button"
          onClick={goToServer}
          className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:outline-none"
          style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
        >
          Go to server
          <ArrowRightIcon size={15} />
        </button>
      </ActionArea>
    </InviteCard>
  );
}

// ── State: valid (ready to join) ──────────────────────────────────────────────

function ValidState({
  preview,
  onJoin,
}: {
  preview: InvitePreview;
  onJoin: () => void;
}) {
  return (
    <InviteCard>
      <ServerPreview name={preview.server.name} memberCount={preview.server.memberCount} />
      <ActionArea>
        <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>
          You&apos;ve been invited to join a server.
        </p>
        <button
          type="button"
          onClick={onJoin}
          className="w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:outline-none"
          style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
        >
          Join server
          <ArrowRightIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full rounded-md px-4 py-2 text-sm font-medium mt-2 transition-colors focus-visible:outline-none"
          style={{ color: 'rgba(255,255,255,0.60)', backgroundColor: 'transparent' }}
        >
          Cancel
        </button>
      </ActionArea>
    </InviteCard>
  );
}

// ── State: joining ────────────────────────────────────────────────────────────

function JoiningState({ preview }: { preview: InvitePreview }) {
  return (
    <InviteCard>
      <ServerPreview name={preview.server.name} memberCount={preview.server.memberCount} dimmed />
      <ActionArea>
        <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.40)' }}>
          You&apos;ve been invited to join a server.
        </p>
        <button
          type="button"
          disabled
          aria-busy="true"
          className="w-full rounded-md px-4 py-2.5 text-sm font-semibold flex items-center justify-center min-h-[42px]"
          style={{
            backgroundColor: 'rgba(16,185,129,0.80)',
            color: '#0a0a0b',
            cursor: 'not-allowed',
          }}
        >
          <SpinnerIcon size={18} className="animate-spin" />
          <span className="sr-only">Joining server…</span>
        </button>
        <button
          type="button"
          disabled
          className="w-full rounded-md px-4 py-2 text-sm font-medium mt-2 cursor-not-allowed"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          Cancel
        </button>
      </ActionArea>
    </InviteCard>
  );
}

// ── State: joined ─────────────────────────────────────────────────────────────

function JoinedState({ serverName }: { serverName: string }) {
  return (
    <InviteCard>
      <div className="flex flex-col items-center pt-8 pb-4 px-8 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          aria-label="Successfully joined"
          aria-live="polite"
          style={{
            backgroundColor: 'rgba(16,185,129,0.10)',
            border: '1px solid rgba(16,185,129,0.30)',
          }}
        >
          <CheckCircleIcon size={32} style={{ color: '#10b981' }} />
        </div>

        <div className="text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            You joined!
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Welcome to {serverName}. Taking you there now…
          </p>
        </div>
      </div>

      <ActionArea>
        <button
          type="button"
          disabled
          aria-busy="true"
          className="w-full rounded-md px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'rgba(16,185,129,0.60)',
            color: '#0a0a0b',
            cursor: 'not-allowed',
          }}
        >
          <SpinnerIcon size={16} className="animate-spin" />
          Opening server…
        </button>
      </ActionArea>
    </InviteCard>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InviteJoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const session = useSessionContext();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  // serverId is known after join (for already-member or after joining)
  const [serverId, setServerId] = useState<string | null>(null);

  // Track if we've determined auth state + fetched preview
  const resolvedRef = useRef(false);

  // Derive session existence outside the effect — avoids type-cast in dep array.
  // SuperTokens SessionContextType is a discriminated union: when loading is false,
  // the object has doesSessionExist. We normalise to a plain boolean.
  const sessionLoaded = !session.loading;
  // biome-ignore lint/suspicious/noExplicitAny: SuperTokens discriminated union — doesSessionExist only present when loading=false
  const sessionExists = sessionLoaded && Boolean((session as any).doesSessionExist);

  useEffect(() => {
    // Wait for SuperTokens session to resolve
    if (!sessionLoaded) return;
    if (!code) {
      setPageState('invalid');
      return;
    }
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    // Fetch the public preview first (no auth needed)
    api
      .getInvitePreview(code)
      .then((data) => {
        setPreview(data);
        const sid = data.server.id;

        if (!sessionExists) {
          setPageState('unauthed');
          return;
        }

        // Session exists — check verification via /me
        api
          .getMe()
          .then((me) => {
            if (!me.emailVerified) {
              setPageState('unverified');
              return;
            }

            // Check if user is already a member by comparing against server list
            api
              .getServers()
              .then((servers) => {
                const alreadyMember = servers.some((s) => s.id === sid);
                if (alreadyMember) {
                  setServerId(sid);
                  setPageState('already-member');
                } else {
                  setPageState('valid');
                }
              })
              .catch(() => {
                // If getServers fails, still allow join attempt
                setPageState('valid');
              });
          })
          .catch(() => {
            // If /me fails, treat as unauthed
            setPageState('unauthed');
          });
      })
      .catch(() => {
        setPageState('invalid');
      });
  }, [sessionLoaded, sessionExists, code]);

  async function handleJoin() {
    if (!code || !preview) return;
    setPageState('joining');
    try {
      const result = await api.joinViaInvite(code);
      setServerId(result.serverId);
      setPageState('joined');
      // Navigate to app after brief feedback (700ms)
      setTimeout(() => {
        sessionStorage.setItem('sh:select-server', result.serverId);
        navigate('/app');
      }, 700);
    } catch (err) {
      // Detect already-member (idempotent 200 returns serverId, so 200 never throws)
      // A 403 means unverified — re-check state
      const msg = err instanceof Error ? err.message : '';
      if (msg.startsWith('403')) {
        setPageState('unverified');
      } else if (msg.startsWith('401')) {
        setPageState('unauthed');
      } else {
        // Fallback: treat as invalid (expired between preview and join)
        setPageState('invalid');
      }
    }
  }

  if (pageState === 'loading') return <LoadingState />;
  if (pageState === 'invalid') return <InvalidState />;
  if (pageState === 'unauthed') return <UnauthedState code={code ?? ''} />;
  if (pageState === 'unverified' && preview) return <UnverifiedState preview={preview} />;
  if (pageState === 'already-member' && preview && serverId)
    return <AlreadyMemberState preview={preview} serverId={serverId} />;
  if (pageState === 'valid' && preview)
    return <ValidState preview={preview} onJoin={() => void handleJoin()} />;
  if (pageState === 'joining' && preview) return <JoiningState preview={preview} />;
  if (pageState === 'joined' && preview) return <JoinedState serverName={preview.server.name} />;

  // Fallback while states are still resolving
  return <LoadingState />;
}
