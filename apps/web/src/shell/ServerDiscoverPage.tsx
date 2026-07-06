/**
 * ServerDiscoverPage — /discover public server directory.
 *
 * Design canonical: design/server-discover.html
 * Design tokens: design/DESIGN-SYSTEM.md
 *
 * States:
 *   loading        — shimmer skeleton grid (height matches real card)
 *   results        — responsive card grid with N communities count line
 *   empty-cold     — honest empty ("No public communities yet — check back soon")
 *   empty-search   — no-match for current query
 *   error          — retryable error (non-error-worded empty is NOT used here)
 *
 * Per-card states: default / joining (spinner) / joined ("Open" navigates to server)
 *
 * A11y:
 *   - aria-live results count region (aria-describedby binding search ↔ count)
 *   - Role=status on live region
 *   - Focus ring on all interactive elements
 *   - Reduced-motion: animations disabled
 */

import type { DiscoverServer } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../auth/api';
import { useServers } from './ServerContext';
import {
  CompassIcon,
  MagnifyingGlassIcon,
  SpinnerIcon,
  UsersIcon,
  WarningCircleIcon,
  XIcon,
} from './icons';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

function serverInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic avatar background colour slot (0-2) from server id. */
function avatarSlot(id: string): number {
  return id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % 3;
}

const AVATAR_STYLES = [
  {
    backgroundColor: '#27272a',
    color: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  {
    backgroundColor: '#3f3f46',
    color: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  {
    backgroundColor: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    border: '1px solid rgba(16,185,129,0.25)',
  },
] as const;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg flex flex-col h-[220px]"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '20px',
      }}
    >
      <div className="flex gap-3 items-start mb-3">
        <div
          className="skeleton-shimmer rounded-xl flex-shrink-0"
          style={{ width: 48, height: 48 }}
        />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton-shimmer rounded" style={{ height: 14, width: '75%' }} />
          <div className="skeleton-shimmer rounded" style={{ height: 11, width: '35%' }} />
        </div>
      </div>
      <div className="space-y-2 flex-1">
        <div className="skeleton-shimmer rounded" style={{ height: 11, width: '100%' }} />
        <div className="skeleton-shimmer rounded" style={{ height: 11, width: '80%' }} />
      </div>
      <div
        className="mt-4 flex justify-between items-center pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="skeleton-shimmer rounded-full" style={{ height: 22, width: 60 }} />
        <div className="skeleton-shimmer rounded-md" style={{ height: 34, width: 72 }} />
      </div>
    </div>
  );
}

// ── Server Card ───────────────────────────────────────────────────────────────

type CardState = 'default' | 'joining' | 'joined';

type ServerCardProps = {
  server: DiscoverServer;
  cardState: CardState;
  onJoin: (id: string) => void;
  onOpen: (id: string) => void;
  staggerIdx: number;
};

function ServerCard({ server, cardState, onJoin, onOpen, staggerIdx }: ServerCardProps) {
  const avatarStyle = AVATAR_STYLES[avatarSlot(server.id)];
  const isJoined = cardState === 'joined';
  const isJoining = cardState === 'joining';

  return (
    <article
      className="server-card rounded-lg flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: '#1c1c1f',
        border: '1px solid rgba(255,255,255,0.06)',
        animationDelay: `${staggerIdx * 60}ms`,
      }}
    >
      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-semibold text-lg"
            style={avatarStyle}
          >
            {serverInitials(server.name)}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3
              className="font-semibold text-base truncate"
              style={{ color: 'rgba(255,255,255,0.92)' }}
              title={server.name}
            >
              {server.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <UsersIcon size={12} style={{ color: 'rgba(255,255,255,0.60)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {server.memberCount.toLocaleString()} members
              </span>
            </div>
          </div>
        </div>

        {server.description ? (
          <p
            className="text-sm leading-relaxed line-clamp-2 flex-1"
            style={{ color: 'rgba(255,255,255,0.60)' }}
          >
            {server.description}
          </p>
        ) : (
          <p className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            No description provided.
          </p>
        )}

        {server.topic && (
          <div className="mt-4">
            <span
              className="text-[11px] font-medium px-2 py-1 rounded"
              style={{
                backgroundColor: '#27272a',
                color: 'rgba(255,255,255,0.60)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {server.topic}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3 flex items-center justify-end"
        style={{
          backgroundColor: '#121214',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {isJoined ? (
          <button
            type="button"
            onClick={() => onOpen(server.id)}
            aria-label={`Open ${server.name}`}
            className="text-sm font-semibold rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: '#27272a',
              color: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '6px 16px',
              minWidth: 72,
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Open
          </button>
        ) : isJoining ? (
          <button
            type="button"
            disabled
            aria-busy="true"
            aria-label={`Joining ${server.name}`}
            className="rounded-md flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(16,185,129,0.7)',
              color: '#0a0a0b',
              padding: '6px 0',
              width: 72,
              height: 34,
              cursor: 'not-allowed',
            }}
          >
            <SpinnerIcon size={16} className="animate-spin" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(server.id)}
            aria-label={`Join ${server.name}`}
            className="text-sm font-semibold rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 hover:-translate-y-px"
            style={{
              backgroundColor: '#10b981',
              color: '#0a0a0b',
              padding: '6px 16px',
              minWidth: 72,
              boxShadow: '0 2px 10px rgba(16,185,129,0.2)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(16,185,129,0.2)';
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#34d399';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
            }}
          >
            Join
          </button>
        )}
      </div>
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'results' | 'empty-cold' | 'empty-search' | 'error';

export function ServerDiscoverPage() {
  const navigate = useNavigate();
  const { refetch: refetchServerList, selectServer } = useServers();

  const [servers, setServers] = useState<DiscoverServer[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  // Per-card error message (non-destructive inline error)
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsCountId = 'discover-results-count';

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchServers = useCallback(async (q: string, currentOffset: number, append: boolean) => {
    if (!append) setLoadState('loading');

    try {
      const params: { q?: string; limit?: number; offset?: number } = {
        limit: PAGE_SIZE,
        offset: currentOffset,
      };
      if (q) params.q = q;
      const data = await api.getDiscoverServers(params);
      const list = data.servers;

      setServers((prev) => (append ? [...prev, ...list] : list));
      setOffset(currentOffset + list.length);
      setHasMore(list.length === PAGE_SIZE);

      if (!append) {
        if (list.length === 0) {
          setLoadState(q ? 'empty-search' : 'empty-cold');
        } else {
          setLoadState('results');
        }
      } else {
        setLoadingMore(false);
        // If appended results come back empty, hide load more
        if (list.length === 0) setHasMore(false);
      }
    } catch {
      if (!append) {
        setLoadState('error');
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchServers('', 0, false);
  }, [fetchServers]);

  // ── Debounced search ──────────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = val.trim();
      setQuery(trimmed);
      setOffset(0);
      void fetchServers(trimmed, 0, false);
    }, 300);
  }

  function handleClear() {
    setInputValue('');
    setQuery('');
    setOffset(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void fetchServers('', 0, false);
  }

  // ── Load more ─────────────────────────────────────────────────────────────

  function handleLoadMore() {
    setLoadingMore(true);
    void fetchServers(query, offset, true);
  }

  // ── Join ──────────────────────────────────────────────────────────────────

  async function handleJoin(serverId: string) {
    setCardStates((prev) => ({ ...prev, [serverId]: 'joining' }));
    setCardErrors((prev) => {
      const next = { ...prev };
      delete next[serverId];
      return next;
    });

    try {
      const result = await api.joinPublicServer(serverId);
      setCardStates((prev) => ({ ...prev, [serverId]: 'joined' }));
      // Refresh the member-scoped server list so the joined server appears in the rail
      refetchServerList();
      // Store pending select so ServerContext auto-selects after refetch
      sessionStorage.setItem('sh:select-server', result.serverId);
    } catch (err) {
      setCardStates((prev) => {
        const next = { ...prev };
        delete next[serverId];
        return next;
      });
      const msg = err instanceof Error ? err.message : '';
      setCardErrors((prev) => ({
        ...prev,
        [serverId]: msg.startsWith('40')
          ? 'Could not join. Server may be private.'
          : 'Join failed — please try again.',
      }));
    }
  }

  function handleOpen(serverId: string) {
    selectServer(serverId);
    navigate('/app');
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const totalCount = servers.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col flex-1 min-w-0 overflow-hidden"
      style={{ backgroundColor: '#0a0a0b' }}
    >
      {/* Shimmer keyframe (injected once) */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer { animation: none; background-position: 0 0; }
          .server-card { transition: none !important; }
        }
        .server-card {
          transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .server-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.10) !important;
          box-shadow: 0 0 15px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.5);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ARIA live region for search results */}
      <div id={resultsCountId} className="sr-only" aria-live="polite" role="status" />

      {/* Sticky header */}
      <header
        className="sticky top-0 z-20 px-6 py-5 lg:px-12 flex flex-col gap-4"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(10,10,11,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <h1
            className="text-xl font-semibold flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            <CompassIcon size={20} style={{ color: '#10b981' }} />
            Discover Communities
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Find public study groups, campus hubs, and academic circles.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-2xl group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon
              size={16}
              style={{ color: 'rgba(255,255,255,0.40)', transition: 'color 200ms ease' }}
            />
          </div>
          <input
            type="text"
            id="discover-search"
            value={inputValue}
            onChange={handleInputChange}
            aria-label="Search servers"
            aria-describedby={resultsCountId}
            autoComplete="off"
            placeholder="Search by topic, course, or server name..."
            className="block w-full text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2"
            style={{
              paddingLeft: 36,
              paddingRight: inputValue ? 36 : 12,
              paddingTop: 10,
              paddingBottom: 10,
              backgroundColor: '#121214',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.92)',
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.80)';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
            >
              <div
                className="rounded-full p-1 transition-colors"
                style={{ backgroundColor: '#27272a' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#27272a';
                }}
              >
                <XIcon size={11} style={{ color: 'rgba(255,255,255,0.60)' }} />
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 pb-24">
        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loadState === 'loading' && (
          <div
            className="grid grid-cols-1 gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            }}
            aria-label="Loading communities"
            aria-busy="true"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {loadState === 'error' && (
          <div
            className="flex flex-col items-center justify-center max-w-md mx-auto text-center py-20"
            role="alert"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                backgroundColor: 'rgba(239,68,68,0.10)',
                border: '1px dashed rgba(239,68,68,0.20)',
              }}
            >
              <WarningCircleIcon size={36} style={{ color: '#ef4444' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Couldn&apos;t load the directory
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              We ran into a problem fetching the community list. Please check your connection and
              try again.
            </p>
            <button
              type="button"
              onClick={() => void fetchServers(query, 0, false)}
              className="mt-6 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#10b981',
                color: '#0a0a0b',
                boxShadow: '0 2px 10px rgba(16,185,129,0.2)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(16,185,129,0.2)';
              }}
            >
              Retry Request
            </button>
          </div>
        )}

        {/* ── Cold-start empty ──────────────────────────────────────────── */}
        {loadState === 'empty-cold' && (
          <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center py-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                backgroundColor: '#121214',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Planet-like icon for empty universe */}
              <svg
                width={36}
                height={36}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                <circle cx="12" cy="12" r="10" />
                <ellipse cx="12" cy="12" rx="10" ry="4" />
                <line x1="12" y1="2" x2="12" y2="22" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
              No public communities yet
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              It&apos;s quiet out here — check back soon!
            </p>
          </div>
        )}

        {/* ── No search match ───────────────────────────────────────────── */}
        {loadState === 'empty-search' && (
          <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center py-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                backgroundColor: '#121214',
                border: '1px dashed rgba(255,255,255,0.06)',
              }}
            >
              <MagnifyingGlassIcon size={36} style={{ color: 'rgba(255,255,255,0.40)' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
              No communities match &ldquo;
              <span style={{ color: '#10b981' }}>{query}</span>
              &rdquo;
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Try broadening your search terms or checking your spelling.
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="mt-6 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#10b981',
                color: '#0a0a0b',
                boxShadow: '0 2px 10px rgba(16,185,129,0.2)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(16,185,129,0.2)';
              }}
            >
              Clear Search
            </button>
          </div>
        )}

        {/* ── Results grid ──────────────────────────────────────────────── */}
        {loadState === 'results' && (
          <>
            {/* Results count — also the aria-live target */}
            <p
              id={resultsCountId}
              className="text-sm mb-6"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              aria-live="polite"
              role="status"
            >
              {totalCount} {totalCount === 1 ? 'community' : 'communities'}
            </p>

            <div
              className="grid grid-cols-1 gap-6 mb-8"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {servers.map((srv, idx) => (
                <div key={srv.id}>
                  <ServerCard
                    server={srv}
                    cardState={cardStates[srv.id] ?? 'default'}
                    onJoin={(id) => void handleJoin(id)}
                    onOpen={handleOpen}
                    staggerIdx={idx}
                  />
                  {cardErrors[srv.id] && (
                    <p className="text-xs mt-1.5 px-1" role="alert" style={{ color: '#f87171' }}>
                      {cardErrors[srv.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-4 w-full">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  aria-busy={loadingMore}
                  className="px-6 py-2.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 flex items-center gap-2"
                  style={{
                    backgroundColor: '#121214',
                    color: 'rgba(255,255,255,0.92)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.4)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c1f';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#121214';
                  }}
                >
                  {loadingMore ? <SpinnerIcon size={14} className="animate-spin" /> : null}
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
