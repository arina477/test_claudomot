/**
 * MessageList — scrollable message area for a channel.
 *
 * - role="log" aria-live="polite" (design spec)
 * - Newest at bottom; scroll-to-bottom on new messages.
 * - "Load older" affordance at the top (scroll-up) via nextCursor.
 * - Real-message row states (wave-12 + wave-13):
 *   - sent: normal row + row-actions (edit/delete for own; react for all)
 *   - editing: inline textarea + Save/Cancel + Enter/Esc keyboard
 *   - delete-confirm: in-row confirm strip before DELETE call
 *   - tombstone (isDeleted): muted "This message was deleted" — no content/reactions/actions
 *   - (edited) indicator after inline content
 * - Optimistic row states:
 *   - pending (greyed + clock + aria-busy)
 *   - failed (danger tint + Retry button, role=alert)
 * - Reaction pills (emoji+count, reactedByMe highlighted) + add-reaction popover.
 * - Empty-channel state rendered IN PLACE of the list when messages=[].
 * - Loading / error states.
 *
 * Receives the full message list (real + optimistic) from useMessages hook.
 */

import type {
  AttachmentRef,
  MentionRef,
  MessageResponse,
  ReactionSummary,
} from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowsOutIcon,
  ChatsCircleIcon,
  ClockIcon,
  DownloadSimpleIcon,
  FileIcon,
  ImageBrokenIcon,
  PencilSimpleIcon,
  ProhibitIcon,
  RetryIcon,
  SmileyIcon,
  SpinnerIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Staged attachment preview — used while the message is in the outbox. */
export type StagedAttachmentPreview = {
  /** Local object-URL for images (revoke after send); undefined for file-chips */
  previewUrl?: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export type OptimisticMessage = {
  /** Unique client-generated key — also used for dedup with the server id */
  idempotencyKey: string;
  content: string;
  /** Display name shown in the row */
  authorDisplay: string;
  state: 'pending' | 'failed';
  /** Staged attachment previews shown while the message is in the outbox */
  stagedAttachments?: StagedAttachmentPreview[];
  /**
   * Validated attachments carried for retry — not rendered directly but
   * passed back to the retry call so the API body is correct.
   * Kept as unknown[] to avoid importing ValidatedAttachment in MessageList
   * (shared types are type-only in the web package).
   */
  validatedAttachments?: unknown[];
};

export type DisplayMessage =
  | ({ kind: 'real' } & MessageResponse)
  | ({ kind: 'optimistic' } & OptimisticMessage);

type Props = {
  messages: DisplayMessage[];
  loadingInitial: boolean;
  loadingOlder: boolean;
  errorInitial: boolean;
  hasOlderMessages: boolean;
  onLoadOlder: () => void;
  onRetry: (idempotencyKey: string) => void;
  /** Called when user saves an inline edit */
  onEdit?: ((messageId: string, content: string) => void) | null;
  /** Called when user confirms delete */
  onDelete?: ((messageId: string) => void) | null;
  /** Called when user clicks a reaction pill or add-reaction emoji */
  onReaction?: ((messageId: string, emoji: string) => void) | null;
  /** The current user's ID — used to decide if edit/delete is shown */
  currentUserId?: string | null;
  /**
   * The current viewer's username (from profile.username).
   * Used to identify self-mentions and render them with emerald emphasis.
   * Distinct from currentUserId which is also the username in MainColumn.
   */
  viewerUsername?: string | null;
  /** Label for the composer hint, e.g. "general" */
  channelName?: string;
  /**
   * Called when user clicks the thread affordance chip.
   * Passes the parent MessageResponse + the affordance button element (for
   * focus-restore on panel close — D-carry 2).
   * D-carry 3: the affordance chip is only rendered when replyCount > 0 (hidden at 0).
   */
  onOpenThread?:
    | ((
        parentMessage: import('@studyhall/shared').MessageResponse,
        triggerEl: HTMLButtonElement,
      ) => void)
    | null;
  /**
   * The parentId of the currently open thread (if any).
   * Used to set aria-expanded on the affordance button of the open thread.
   */
  openThreadParentId?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Relative timestamp for the thread affordance chip ("last reply Xm ago").
 * Keeps the label short: seconds → "just now", minutes → "Nm ago",
 * hours → "Nh ago", days → "Nd ago", else the full locale date.
 */
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

/** Derive initials from an authorId or display string. */
function initials(s: string): string {
  const words = s.trim().split(/\s+/);
  if (words.length >= 2) {
    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase() || '?';
}

const COMMON_EMOJI = ['👍', '❤️', '😂', '🎉', '🤔', '✅'];

// ---------------------------------------------------------------------------
// Attachment helpers
// ---------------------------------------------------------------------------

/** Format bytes into human-readable string (KB / MB). */
function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** True when the content-type is an image we can preview inline. */
function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

// ---------------------------------------------------------------------------
// Image lightbox (D-carry: focus-trap, Esc close, backdrop click, focus restore)
// ---------------------------------------------------------------------------

type LightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

function ImageLightbox({ src, alt, onClose, triggerRef }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the close button on mount; restore focus to trigger on unmount.
  useEffect(() => {
    closeBtnRef.current?.focus();
    const prev = triggerRef.current;
    return () => {
      prev?.focus();
    };
  }, [triggerRef]);

  // Esc to close + focus trap
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap: keep Tab inside dialog
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    // Backdrop — role="presentation" so screen readers focus the inner dialog.
    // Esc is handled by the document keydown listener above; onKeyDown here
    // satisfies the lint/a11y/useKeyWithClickEvents rule.
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={alt || 'Image preview'}
        className="relative flex flex-col items-center max-w-[90vw] max-h-[90dvh]"
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Close image preview"
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          style={{ color: 'rgba(255,255,255,0.70)', backgroundColor: 'rgba(39,39,42,0.80)' }}
        >
          <XIcon size={16} />
        </button>

        {/* Full-size image */}
        <img
          src={src}
          alt={alt}
          className="rounded-md object-contain"
          style={{ maxWidth: '90vw', maxHeight: '85dvh' }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File chip — non-image attachments (+ broken-image fallback chip)
// ---------------------------------------------------------------------------

type FileChipProps = {
  filename: string;
  sizeBytes: number;
  url?: string;
  /** When true renders the broken-image icon/label instead of the generic file icon */
  isBroken?: boolean;
  'aria-label'?: string;
};

function FileChip({ filename, sizeBytes, url, isBroken, 'aria-label': ariaLabel }: FileChipProps) {
  const label =
    ariaLabel ??
    (isBroken ? `Download ${filename} (image failed to preview)` : `Download ${filename}`);

  const inner = (
    <>
      <span
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded"
        style={{ backgroundColor: '#27272a' }}
      >
        {isBroken ? (
          <ImageBrokenIcon size={18} style={{ color: 'rgba(255,255,255,0.60)' }} />
        ) : (
          <FileIcon size={18} style={{ color: '#10b981' }} />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className="truncate text-[13px] font-medium leading-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {filename}
        </span>
        <span
          className="mt-0.5 text-[11px] leading-tight tracking-wide"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          {isBroken ? `Preview unavailable · ${humanSize(sizeBytes)}` : humanSize(sizeBytes)}
        </span>
      </span>
      {url && (
        <DownloadSimpleIcon
          size={16}
          style={{ color: '#10b981', opacity: 0, transition: 'opacity 120ms' }}
          className="ml-1 shrink-0 group-hover/chip:opacity-100"
        />
      )}
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        download
        className="group/chip flex max-w-[280px] min-w-[200px] items-center gap-2.5 rounded-md border px-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        style={{
          backgroundColor: '#1c1c1f',
          borderColor: 'rgba(63,63,70,0.60)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#27272a';
          const dl = (e.currentTarget as HTMLAnchorElement).querySelector('svg:last-child');
          if (dl) (dl as SVGElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1c1c1f';
          const dl = (e.currentTarget as HTMLAnchorElement).querySelector('svg:last-child');
          if (dl) (dl as SVGElement).style.opacity = '0';
        }}
      >
        {inner}
      </a>
    );
  }

  // No URL — static chip (staged preview or broken without URL)
  return (
    <div
      aria-label={label}
      className="group/chip flex max-w-[280px] min-w-[200px] items-center gap-2.5 rounded-md border px-2 py-1.5"
      style={{
        backgroundColor: '#1c1c1f',
        borderColor: 'rgba(63,63,70,0.60)',
      }}
    >
      {inner}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AttachmentRender — renders a single attachment in a message row
// D-carries: inline image preview (max-h-320px) → lightbox on click;
//            img onerror → swap to broken-image chip
// ---------------------------------------------------------------------------

type AttachmentRenderProps = {
  attachment: AttachmentRef;
};

function AttachmentRender({ attachment }: AttachmentRenderProps) {
  const [broken, setBroken] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenLightbox = useCallback(() => setLightboxOpen(true), []);
  const handleCloseLightbox = useCallback(() => setLightboxOpen(false), []);

  const isImage = isImageType(attachment.contentType);

  if (isImage && !broken) {
    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          aria-label={`View full size: ${attachment.filename}`}
          onClick={handleOpenLightbox}
          className="group/img relative block overflow-hidden rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          style={{
            backgroundColor: '#1c1c1f',
            borderColor: 'rgba(63,63,70,0.60)',
          }}
        >
          <img
            src={attachment.url}
            alt={attachment.filename}
            className="w-auto max-w-full object-cover"
            style={{ maxHeight: 320, display: 'block' }}
            onError={() => setBroken(true)}
          />
          {/* Hover overlay with expand cue */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(10,10,11,0.40)', backdropFilter: 'blur(1px)' }}
            aria-hidden="true"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform scale-95 group-hover/img:scale-100"
              style={{
                backgroundColor: 'rgba(28,28,31,0.90)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <ArrowsOutIcon size={20} style={{ color: 'rgba(255,255,255,0.92)' }} />
            </div>
          </div>
        </button>

        {/* Lightbox portal — rendered outside the message row */}
        {lightboxOpen && (
          <ImageLightbox
            src={attachment.url}
            alt={attachment.filename}
            onClose={handleCloseLightbox}
            triggerRef={triggerRef as React.RefObject<HTMLButtonElement | null>}
          />
        )}
      </>
    );
  }

  // Broken image or non-image: file chip
  return (
    <FileChip
      filename={attachment.filename}
      sizeBytes={attachment.sizeBytes}
      url={attachment.url}
      isBroken={isImage && broken}
    />
  );
}

// ---------------------------------------------------------------------------
// AttachmentList — renders 0-N attachments below message content
// ---------------------------------------------------------------------------

type AttachmentListProps = {
  attachments: AttachmentRef[];
};

function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {attachments.map((a) => (
        <AttachmentRender key={a.id} attachment={a} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mention pill rendering
// ---------------------------------------------------------------------------

/**
 * MentionPill — renders a single @username chip.
 *
 * Design (design/server-channel-view.html §2 self-mention, §1 other-mention):
 *   self  = bg-emerald-500/10 + text-emerald-300 + ring-1 ring-emerald-500/30
 *   other = bg-surface-700 (#27272a) + text-zinc-100 (rgba 255,255,255,0.92)
 *   Both: rounded-md, inline-flex, px-1.5 py-0.5, text-[14px] font-medium
 *   DISTINCT from reaction pills (which are rounded-full / pill-shaped).
 */
function MentionPill({ username, isSelf }: { username: string; isSelf: boolean }) {
  if (isSelf) {
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 mx-[1px] -my-[1px] align-baseline rounded-md text-[14px] font-medium"
        style={{
          backgroundColor: 'rgba(16,185,129,0.10)',
          color: '#6ee7b7',
          outline: '1px solid rgba(16,185,129,0.30)',
          outlineOffset: '-1px',
        }}
        aria-label={`mention: @${username} (you)`}
      >
        @{username}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 mx-[1px] -my-[1px] align-baseline rounded-md text-[14px] font-medium"
      style={{
        backgroundColor: '#27272a',
        color: 'rgba(255,255,255,0.92)',
      }}
      aria-label={`mention: @${username}`}
    >
      @{username}
    </span>
  );
}

/**
 * Tokenise a message body and replace @username tokens with MentionPill
 * components.
 *
 * Strategy: find all @<word> tokens in the content. For each, check the
 * mentions[] array (from the server) to see if it resolves to a real user.
 * Unresolved @tokens (not in mentions[]) are rendered as plain text.
 *
 * Self-detection: compare the resolved MentionRef.username against
 * viewerUsername (from profile.username). No UUID needed.
 */
function renderBodyWithMentions(
  content: string,
  mentions: MentionRef[],
  viewerUsername: string | null,
): React.ReactNode {
  // Build a map: normalised username → MentionRef for O(1) lookup
  const mentionMap = new Map<string, MentionRef>();
  for (const m of mentions) {
    mentionMap.set(m.username.toLowerCase(), m);
  }

  // Split on @word boundaries — keep the delimiter so we can inspect it
  const parts = content.split(/(@\S+)/);

  return parts.map((part, idx) => {
    if (part.startsWith('@')) {
      // Strip trailing punctuation that is not part of the username
      const raw = part.slice(1).replace(/[.,!?;:)]+$/, '');
      const ref = mentionMap.get(raw.toLowerCase());
      if (ref) {
        const isSelf =
          viewerUsername !== null && ref.username.toLowerCase() === viewerUsername.toLowerCase();
        return (
          <MentionPill
            // biome-ignore lint/suspicious/noArrayIndexKey: static split, stable
            key={idx}
            username={ref.username}
            isSelf={isSelf}
          />
        );
      }
    }
    // Plain text segment (or unresolved @token)
    // biome-ignore lint/suspicious/noArrayIndexKey: static split, stable
    return <span key={idx}>{part}</span>;
  });
}

// ---------------------------------------------------------------------------
// Add-reaction popover
// ---------------------------------------------------------------------------

type AddReactionPopoverProps = {
  messageId: string;
  onReact: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
};

function AddReactionPopover({ messageId, onReact, onClose, anchorRef }: AddReactionPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, anchorRef]);

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="Add a reaction"
      data-testid={`reaction-popover-${messageId}`}
      className="absolute z-20 flex items-center gap-0.5 rounded-md border p-1 shadow-lg"
      style={{
        top: '-44px',
        right: 0,
        backgroundColor: '#27272a',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {COMMON_EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="menuitem"
          aria-label={`React ${emoji}`}
          onClick={() => {
            onReact(emoji);
            onClose();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors focus:outline-none focus-visible:ring-2"
          style={{ lineHeight: 1 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reaction pills row
// ---------------------------------------------------------------------------

type ReactionPillsProps = {
  reactions: ReactionSummary[];
  messageId: string;
  onReaction: ((messageId: string, emoji: string) => void) | null;
  onOpenPopover: () => void;
};

function ReactionPills({ reactions, messageId, onReaction, onOpenPopover }: ReactionPillsProps) {
  if (reactions.length === 0 && onReaction === null) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => {
        const pressed = r.reactedByMe;
        return (
          <button
            key={r.emoji}
            type="button"
            aria-pressed={pressed}
            aria-label={
              pressed
                ? `${r.emoji} reaction, ${r.count}, you reacted — click to remove`
                : `${r.emoji} reaction, ${r.count} — click to react`
            }
            data-testid={`reaction-pill-${messageId}-${r.emoji}`}
            onClick={() => onReaction?.(messageId, r.emoji)}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2 py-0 transition-colors focus:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: pressed ? 'rgba(16,185,129,0.14)' : '#27272a',
              borderColor: pressed ? 'rgba(16,185,129,0.55)' : 'rgba(63,63,70,0.70)',
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            <span className="text-[13px] leading-none">{r.emoji}</span>
            <span
              className="text-xs font-semibold"
              style={{ color: pressed ? '#a7f3d0' : 'rgba(255,255,255,0.40)' }}
            >
              {r.count}
            </span>
          </button>
        );
      })}
      {/* Add-reaction affordance */}
      {onReaction !== null && (
        <button
          type="button"
          aria-label="Add reaction"
          aria-haspopup="true"
          data-testid={`add-reaction-inline-${messageId}`}
          onClick={onOpenPopover}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2"
          style={{
            backgroundColor: 'rgba(39,39,42,0.60)',
            borderColor: 'rgba(63,63,70,0.50)',
            color: 'rgba(255,255,255,0.40)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.90)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <SmileyIcon size={14} />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row-action bar
// ---------------------------------------------------------------------------

type RowActionsProps = {
  messageId: string;
  isOwn: boolean;
  onEdit: (() => void) | null;
  onDelete: (() => void) | null;
  onReact: () => void;
};

function RowActions({ isOwn, onEdit, onDelete, onReact }: RowActionsProps) {
  return (
    <div
      className="row-actions absolute -top-3 right-3 z-10 flex items-center overflow-hidden rounded-md border shadow-lg"
      data-testid="row-actions"
      style={{
        backgroundColor: '#27272a',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* React button — always visible */}
      <button
        type="button"
        aria-label="Add reaction"
        aria-haspopup="true"
        onClick={onReact}
        className="flex h-8 w-8 items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
        style={{ color: 'rgba(255,255,255,0.40)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
        }}
      >
        <SmileyIcon size={16} />
      </button>

      {/* Edit — own messages only */}
      {isOwn && onEdit !== null && (
        <button
          type="button"
          aria-label="Edit your message"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.92)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <PencilSimpleIcon size={16} />
        </button>
      )}

      {/* Delete — own messages (+ moderator: show and handle 403 gracefully) */}
      {onDelete !== null && (
        <button
          type="button"
          aria-label={isOwn ? 'Delete your message' : 'Delete message (moderator)'}
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
            (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <TrashIcon size={16} />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline-edit form
// ---------------------------------------------------------------------------

type InlineEditProps = {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
};

function InlineEdit({ initialContent, onSave, onCancel }: InlineEditProps) {
  const [draft, setDraft] = useState(initialContent);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
    // Move cursor to end
    const len = draft.length;
    taRef.current?.setSelectionRange(len, len);
  }, [draft.length]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = draft.trim();
      if (trimmed) onSave(trimmed);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  return (
    <div className="mt-2 w-full" data-testid="inline-edit-form">
      <div
        className="overflow-hidden rounded-md border transition-shadow focus-within:ring-2"
        style={{
          backgroundColor: '#121214',
          borderColor: 'rgba(63,63,70,0.60)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <label htmlFor={`edit-textarea-${draft}`} className="sr-only">
          Edit your message
        </label>
        <textarea
          ref={taRef}
          id={`edit-textarea-${draft}`}
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="edit-textarea"
          className="w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const trimmed = draft.trim();
            if (trimmed) onSave(trimmed);
          }}
          data-testid="edit-save-btn"
          disabled={!draft.trim()}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2"
          style={{ backgroundColor: '#10b981', color: '#0a0a0b' }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          data-testid="edit-cancel-btn"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2"
          style={{
            color: 'rgba(255,255,255,0.70)',
            backgroundColor: '#27272a',
            borderColor: 'rgba(63,63,70,0.60)',
          }}
        >
          <XIcon size={12} />
          Cancel
        </button>
        <span
          className="ml-1 text-[11px] tracking-wide"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Enter
          </kbd>{' '}
          to save &nbsp;·&nbsp;{' '}
          <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Esc
          </kbd>{' '}
          to cancel
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

type SentRowProps = {
  msg: { kind: 'real' } & MessageResponse;
  currentUserId: string | null;
  viewerUsername: string | null;
  onEdit: ((messageId: string, content: string) => void) | null;
  onDelete: ((messageId: string) => void) | null;
  onReaction: ((messageId: string, emoji: string) => void) | null;
  /** Opens the ThreadPanel for this parent row (D-carry 3: hidden when replyCount===0). */
  onOpenThread: ((msg: MessageResponse, triggerEl: HTMLButtonElement) => void) | null;
  /** Whether this message's thread panel is currently open (for aria-expanded). */
  isThreadOpen: boolean;
};

function SentRow({
  msg,
  currentUserId,
  viewerUsername,
  onEdit,
  onDelete,
  onReaction,
  onOpenThread,
  isThreadOpen,
}: SentRowProps) {
  const abbr = initials(msg.authorId);
  const isOwn = !!currentUserId && msg.authorId === currentUserId;
  const [rowState, setRowState] = useState<'normal' | 'editing' | 'deleting'>('normal');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const reactBtnRef = useRef<HTMLButtonElement>(null);
  // Ref forwarded to ThreadPanel triggerRef so Esc restores focus here (D-carry 2)
  const threadBtnRef = useRef<HTMLButtonElement>(null);

  // Tombstone — isDeleted
  if (msg.isDeleted) {
    return (
      <article
        aria-label="Deleted message"
        data-testid={`tombstone-${msg.id}`}
        className="flex gap-3.5 rounded-md px-4 py-2"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
          style={{ backgroundColor: '#1c1c1f', borderColor: '#27272a' }}
          aria-hidden="true"
        >
          <ProhibitIcon size={16} style={{ color: 'rgba(255,255,255,0.20)' }} />
        </div>
        <div className="flex min-w-0 items-center">
          <span
            className="flex items-center gap-2 text-sm italic"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <TrashIcon size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
            This message was deleted
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      data-testid={`message-row-${msg.id}`}
      className="msg-row group relative flex gap-3.5 rounded-md px-4 py-2 transition-colors"
      style={
        rowState === 'deleting'
          ? { border: '1px solid rgba(239,68,68,0.30)', backgroundColor: 'rgba(239,68,68,0.05)' }
          : rowState === 'editing'
            ? { backgroundColor: 'rgba(39,39,42,0.20)' }
            : {}
      }
      onMouseEnter={(e) => {
        if (rowState === 'normal')
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
      }}
      onMouseLeave={(e) => {
        if (rowState === 'normal') (e.currentTarget as HTMLElement).style.backgroundColor = '';
      }}
    >
      {/* Avatar */}
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {abbr}
      </div>

      {/* Content column */}
      <div className="flex min-w-0 w-full flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {msg.authorId}
          </span>
          <span
            className="text-xs font-medium tracking-wide"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            {formatTime(msg.createdAt)}
          </span>
          {rowState === 'editing' && (
            <span
              className="flex items-center gap-1 text-[11px] font-semibold tracking-wide"
              style={{ color: '#6ee7b7' }}
            >
              <PencilSimpleIcon size={12} />
              Editing
            </span>
          )}
        </div>

        {/* Body: normal, editing, or delete-confirm strip */}
        {rowState === 'editing' ? (
          <InlineEdit
            initialContent={msg.content ?? ''}
            onSave={(content) => {
              onEdit?.(msg.id, content);
              setRowState('normal');
            }}
            onCancel={() => setRowState('normal')}
          />
        ) : rowState === 'deleting' ? (
          <>
            <p
              className="mt-0.5 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.70)' }}
            >
              {msg.content
                ? renderBodyWithMentions(msg.content, msg.mentions, viewerUsername)
                : null}
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
                Delete this message?
              </span>
              <button
                type="button"
                data-testid="delete-confirm-btn"
                onClick={() => {
                  onDelete?.(msg.id);
                  setRowState('normal');
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2"
                style={{ backgroundColor: '#ef4444', color: '#0a0a0b' }}
              >
                <TrashIcon size={13} />
                Delete
              </button>
              <button
                type="button"
                data-testid="delete-cancel-btn"
                onClick={() => setRowState('normal')}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2"
                style={{
                  color: 'rgba(255,255,255,0.70)',
                  backgroundColor: '#27272a',
                  borderColor: 'rgba(63,63,70,0.60)',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className="mt-0.5 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.80)' }}
            >
              {msg.content
                ? renderBodyWithMentions(msg.content, msg.mentions, viewerUsername)
                : null}
              {msg.isEdited && (
                <span
                  className="ml-1 align-baseline text-xs font-normal"
                  title="Edited"
                  data-testid={`edited-indicator-${msg.id}`}
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  (edited)
                </span>
              )}
            </p>

            {/* Attachment render (wave-19 M3) */}
            {msg.attachments && msg.attachments.length > 0 && (
              <AttachmentList attachments={msg.attachments} />
            )}

            {/* Reaction pills */}
            {(msg.reactions.length > 0 || onReaction !== null) && (
              <div className="relative">
                <ReactionPills
                  reactions={msg.reactions}
                  messageId={msg.id}
                  onReaction={onReaction}
                  onOpenPopover={() => setPopoverOpen((v) => !v)}
                />
                {popoverOpen && (
                  <AddReactionPopover
                    messageId={msg.id}
                    onReact={(emoji) => onReaction?.(msg.id, emoji)}
                    onClose={() => setPopoverOpen(false)}
                    anchorRef={reactBtnRef}
                  />
                )}
              </div>
            )}

            {/* Thread affordance chip — D-carry 3: HIDDEN when replyCount === 0 */}
            {onOpenThread !== null &&
              !msg.isDeleted &&
              !msg.threadParentId &&
              (msg.replyCount ?? 0) > 0 && (
                <div className="mt-2 text-left">
                  <button
                    ref={threadBtnRef}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={isThreadOpen}
                    aria-controls="thread-panel"
                    aria-label={`Open thread: ${msg.replyCount === 1 ? '1 reply' : `${msg.replyCount} replies`}${msg.lastReplyAt ? `, last reply ${formatRelativeTime(msg.lastReplyAt)}` : ''}`}
                    data-testid={`thread-affordance-${msg.id}`}
                    onClick={(e) => onOpenThread(msg, e.currentTarget)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                    style={{
                      height: 28,
                      backgroundColor: '#27272a',
                      color: 'rgba(255,255,255,0.92)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#27272a';
                    }}
                  >
                    <ChatsCircleIcon size={15} style={{ color: '#10b981' }} />
                    <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                      {msg.replyCount === 1 ? '1 reply' : `${msg.replyCount} replies`}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-0.5"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      ·
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'rgba(255,255,255,0.40)' }}
                    >
                      {msg.lastReplyAt ? `last reply ${formatRelativeTime(msg.lastReplyAt)}` : ''}
                    </span>
                  </button>
                </div>
              )}
          </>
        )}
      </div>

      {/* Row-action bar — shown on hover/focus-within (CSS .row-actions class) */}
      {rowState === 'normal' && (
        <RowActions
          messageId={msg.id}
          isOwn={isOwn}
          onReact={() => setPopoverOpen((v) => !v)}
          onEdit={isOwn && onEdit !== null ? () => setRowState('editing') : null}
          onDelete={onDelete !== null ? () => setRowState('deleting') : null}
        />
      )}

      {/* Popover anchored to row-action react button when opened from there */}
      {popoverOpen && rowState === 'normal' && (
        <AddReactionPopover
          messageId={msg.id}
          onReact={(emoji) => onReaction?.(msg.id, emoji)}
          onClose={() => setPopoverOpen(false)}
          anchorRef={reactBtnRef}
        />
      )}
    </article>
  );
}

function PendingRow({ msg }: { msg: { kind: 'optimistic' } & OptimisticMessage }) {
  return (
    <article
      aria-busy="true"
      data-testid="pending-message"
      className="group flex gap-3.5 rounded-md px-4 py-2"
      style={{ borderLeft: '2px solid rgba(245,158,11,0.5)' }}
    >
      {/* Avatar — dimmed */}
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          backgroundColor: '#3f3f46',
          color: 'rgba(255,255,255,0.92)',
          opacity: 0.6,
        }}
        aria-hidden="true"
      >
        {initials(msg.authorDisplay)}
      </div>
      <div className="flex min-w-0 w-full flex-col">
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.92)', opacity: 0.6 }}
          >
            {msg.authorDisplay}
          </span>
          {/* Status label at full opacity so amber stays ≥4.5:1 (WCAG AA) */}
          <span
            className="flex items-center gap-1 text-xs font-semibold tracking-wide"
            style={{ color: '#f59e0b' }}
          >
            <ClockIcon size={13} />
            Sending…
          </span>
        </div>
        <p
          className="mt-0.5 text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.80)', opacity: 0.6 }}
        >
          {msg.content}
        </p>
        {/* Staged attachment previews shown while the message is in the outbox */}
        {msg.stagedAttachments && msg.stagedAttachments.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2" style={{ opacity: 0.6 }}>
            {msg.stagedAttachments.map((sa, idx) => {
              const isImg = isImageType(sa.contentType);
              if (isImg && sa.previewUrl) {
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable staged order
                    key={idx}
                    className="overflow-hidden rounded-md border"
                    style={{ borderColor: 'rgba(63,63,70,0.60)', backgroundColor: '#1c1c1f' }}
                  >
                    <img
                      src={sa.previewUrl}
                      alt={sa.filename}
                      className="w-auto object-cover"
                      style={{ maxHeight: 120, maxWidth: 200, display: 'block' }}
                    />
                  </div>
                );
              }
              return (
                <FileChip
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable staged order
                  key={idx}
                  filename={sa.filename}
                  sizeBytes={sa.sizeBytes}
                />
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

function FailedRow({
  msg,
  onRetry,
}: {
  msg: { kind: 'optimistic' } & OptimisticMessage;
  onRetry: (key: string) => void;
}) {
  return (
    <div
      role="alert"
      data-testid="failed-message"
      className="group flex gap-3.5 rounded-md px-4 py-2"
      style={{
        border: '1px solid rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
      }}
    >
      {/* Avatar */}
      <div
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ backgroundColor: '#3f3f46', color: 'rgba(255,255,255,0.92)' }}
        aria-hidden="true"
      >
        {initials(msg.authorDisplay)}
      </div>
      <div className="flex min-w-0 w-full flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {msg.authorDisplay}
          </span>
          <span
            className="flex items-center gap-1 text-xs font-semibold tracking-wide"
            style={{ color: '#fca5a5' }}
          >
            <WarningCircleIcon size={13} />
            Failed to send
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.80)' }}>
          {msg.content}
        </p>
        {/* Staged attachment previews shown in failed row */}
        {msg.stagedAttachments && msg.stagedAttachments.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2" style={{ opacity: 0.6 }}>
            {msg.stagedAttachments.map((sa, idx) => {
              const isImg = isImageType(sa.contentType);
              if (isImg && sa.previewUrl) {
                return (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable staged order
                    key={idx}
                    className="overflow-hidden rounded-md border"
                    style={{ borderColor: 'rgba(63,63,70,0.60)', backgroundColor: '#1c1c1f' }}
                  >
                    <img
                      src={sa.previewUrl}
                      alt={sa.filename}
                      className="w-auto object-cover"
                      style={{ maxHeight: 120, maxWidth: 200, display: 'block' }}
                    />
                  </div>
                );
              }
              return (
                <FileChip
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable staged order
                  key={idx}
                  filename={sa.filename}
                  sizeBytes={sa.sizeBytes}
                />
              );
            })}
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRetry(msg.idempotencyKey)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: '#fca5a5',
              backgroundColor: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.40)',
            }}
            aria-label="Retry sending this message"
          >
            <RetryIcon size={13} />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty channel state
// ---------------------------------------------------------------------------

function EmptyChannelState({ channelName }: { channelName?: string }) {
  return (
    <div
      data-testid="empty-channel-state"
      className="flex flex-1 flex-col items-center justify-center px-6 text-center select-none"
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(39,39,42,0.60)' }}
        aria-hidden="true"
      >
        <ChatsCircleIcon size={32} style={{ color: 'rgba(255,255,255,0.40)' }} />
      </div>
      <h3
        className="text-xl font-semibold tracking-tight"
        style={{ color: 'rgba(255,255,255,0.92)' }}
      >
        No messages yet
      </h3>
      <p className="mt-1.5 max-w-xs text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Start the conversation — your first message kicks off{' '}
        {channelName ? (
          <span style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 500 }}>#{channelName}</span>
        ) : (
          'this channel'
        )}
        .
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageList
// ---------------------------------------------------------------------------

export function MessageList({
  messages,
  loadingInitial,
  loadingOlder,
  errorInitial,
  hasOlderMessages,
  onLoadOlder,
  onRetry,
  onEdit,
  onDelete,
  onReaction,
  currentUserId,
  viewerUsername,
  channelName,
  onOpenThread,
  openThreadParentId,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Scroll to bottom when new messages arrive (not when loading older ones)
  useEffect(() => {
    const prevLen = prevLengthRef.current;
    const curLen = messages.length;
    // Only auto-scroll when appending new messages (not loading older)
    if (curLen > prevLen && !loadingOlder) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = curLen;
  }, [messages.length, loadingOlder]);

  // Initial scroll to bottom on first load — intentionally omits messages.length
  // from deps so it only fires on the loadingInitial → false transition, not on
  // every incoming message (the above effect handles that).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-shot scroll
  useEffect(() => {
    if (!loadingInitial && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [loadingInitial]);

  // Scroll-up detection for load-older
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    function handleScroll() {
      if (!el) return;
      // Trigger when scrolled within 80px of the top
      if (el.scrollTop < 80 && hasOlderMessages && !loadingOlder) {
        onLoadOlder();
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [hasOlderMessages, loadingOlder, onLoadOlder]);

  // ── Loading initial fetch ──────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        <SpinnerIcon size={24} className="animate-spin" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (errorInitial) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Couldn&apos;t load messages. Check your connection and try again.
        </p>
      </div>
    );
  }

  // ── Empty state — rendered IN PLACE of the list ───────────────────────────
  if (messages.length === 0) {
    return <EmptyChannelState {...(channelName ? { channelName } : {})} />;
  }

  // ── Message list ──────────────────────────────────────────────────────────
  return (
    <div
      ref={listRef}
      role="log"
      aria-live="polite"
      aria-label={`Messages${channelName ? ` in #${channelName}` : ''}`}
      data-testid="message-list"
      className="flex flex-1 flex-col gap-1 overflow-y-auto px-1 py-4 select-text"
      style={{ position: 'relative' }}
    >
      {/* Load-older affordance at top */}
      {hasOlderMessages && (
        <output
          aria-live="polite"
          className="flex items-center justify-center py-2"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          {loadingOlder ? (
            <>
              <SpinnerIcon size={14} className="animate-spin mr-2" />
              <span className="text-xs tracking-wide">Loading older messages…</span>
            </>
          ) : (
            <button
              type="button"
              onClick={onLoadOlder}
              className="rounded text-xs tracking-wide underline focus-visible:outline-none focus-visible:ring-2"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Load older messages
            </button>
          )}
        </output>
      )}

      {/* Message rows */}
      {messages.map((msg) => {
        if (msg.kind === 'real') {
          return (
            <SentRow
              key={msg.id}
              msg={msg}
              currentUserId={currentUserId ?? null}
              viewerUsername={viewerUsername ?? null}
              onEdit={onEdit ?? null}
              onDelete={onDelete ?? null}
              onReaction={onReaction ?? null}
              onOpenThread={onOpenThread ?? null}
              isThreadOpen={openThreadParentId === msg.id}
            />
          );
        }
        if (msg.state === 'pending') {
          return <PendingRow key={msg.idempotencyKey} msg={msg} />;
        }
        return <FailedRow key={msg.idempotencyKey} msg={msg} onRetry={onRetry} />;
      })}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
