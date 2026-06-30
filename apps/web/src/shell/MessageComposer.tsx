/**
 * MessageComposer — auto-grow textarea + send button + @mention autocomplete.
 *
 * Wave-14 baseline:
 * - Enter = send, Shift+Enter = newline (design spec §8 MessageComposer).
 * - Send button disabled when empty or when sending.
 * - Calls onSend(content) → parent owns optimistic state.
 * - Clears textarea on send.
 * - onKeyPress / onBlur forwarded for typing indicator throttling.
 *
 * Wave-15 additions (@mention autocomplete):
 * - Detects @-trigger only after whitespace or at the start of the input
 *   (email-safe rule: a@b does NOT trigger the popover).
 * - While the popover is open, ↑↓/Enter are captured by MentionAutocomplete
 *   (Enter selects and does NOT send the message).
 * - On selection, inserts "@username " at the cursor position and closes
 *   the popover.
 * - Escape closes the popover without inserting.
 * - Popover positioned above the composer form (absolute, bottom-full).
 *
 * Wave-19 additions (M3 attachments):
 * - Paperclip attach button (hidden file input, D-carry: hidden-input pattern).
 * - Staged-attachment strip: image thumbnail via URL.createObjectURL / file chip
 *   + filename + human size + remove ✕.
 * - Client-side guard: ≤10MB + content-type allowlist (mirrors server).
 * - Per-tile upload progress (emerald bar) + failed-upload tile with retry/clear.
 * - On SEND: presign → PUT → confirm → collect ValidatedAttachment[] → send.
 * - aria-live="polite" on the staged strip (D-carry).
 * - Broken-send guard: never sends if any tile is in the uploading/error state.
 *
 * A11y (combobox pattern — WAI-ARIA 1.2 §combo-with-list):
 * - The textarea carries role=combobox + aria-expanded + aria-controls
 *   (pointing at the listbox id) + aria-activedescendant (the focused option id).
 * - The listbox div + option divs live in MentionAutocomplete; they do NOT
 *   carry aria-activedescendant and do NOT need to be focusable.
 */

import type { ValidatedAttachment } from '@studyhall/shared';
import { useCallback, useId, useRef, useState } from 'react';
import { api } from '../auth/api';
import type { MentionInsertPayload } from './MentionAutocomplete';
import { MentionAutocomplete } from './MentionAutocomplete';
import type { StagedAttachmentPreview } from './MessageList';
import { PaperPlaneIcon, PaperclipIcon, SpinnerIcon, WarningCircleIcon, XIcon } from './icons';

// ---------------------------------------------------------------------------
// Constants — mirror server-side allowlist
// ---------------------------------------------------------------------------

/** Maximum file size in bytes (10 MB). Must mirror server validation. */
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Allowlisted content-types.
 * Must mirror the server-side attachment allowlist in apps/api
 * (ATTACHMENT_ALLOWED_MIME in apps/api/src/files/files.service.ts).
 */
const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

/** Accept attribute string for the file input (union of all allowed types). */
const ACCEPT = [...ALLOWED_CONTENT_TYPES].join(',');

// ---------------------------------------------------------------------------
// Staged attachment state machine
// ---------------------------------------------------------------------------

type StagedState =
  | { phase: 'ready'; localUrl?: string } // waiting to be uploaded on send
  | { phase: 'uploading'; localUrl?: string; progress: number }
  | { phase: 'done'; validated: ValidatedAttachment; localUrl?: string }
  | { phase: 'error'; message: string; localUrl?: string };

/** Helper: spread `localUrl` only when it is defined (exactOptionalPropertyTypes). */
function withLocalUrl(url: string | undefined): { localUrl: string } | Record<string, never> {
  return url !== undefined ? { localUrl: url } : {};
}

type StagedFile = {
  id: string; // local UUID
  file: File;
  filename: string;
  contentType: string;
  sizeBytes: number;
  state: StagedState;
};

// ---------------------------------------------------------------------------
// @-trigger detection helpers
// ---------------------------------------------------------------------------

/**
 * Given the textarea value and current cursor position, return the active
 * @-query string (without the @ prefix) if the cursor is inside an @-token
 * that started after whitespace or at the start of the string.
 *
 * Returns null when the cursor is not in a valid @-token context.
 *
 * Examples (| = cursor):
 *   "hello @dav|"  → "dav"
 *   "@dav|"        → "dav"
 *   "test@dav|"    → null  (no preceding whitespace)
 *   "hello @|"     → ""    (empty query — show all members)
 */
function getMentionQuery(value: string, cursor: number): string | null {
  const textBeforeCursor = value.slice(0, cursor);
  // Find the last @ before the cursor
  const atIdx = textBeforeCursor.lastIndexOf('@');
  if (atIdx === -1) return null;
  // Ensure the character before @ is a whitespace or start-of-string
  const before: string | null = atIdx === 0 ? null : (textBeforeCursor[atIdx - 1] ?? null);
  if (before !== null && !/\s/.test(before)) return null;
  // The query is everything from @ up to the cursor; it must not contain spaces
  const query = textBeforeCursor.slice(atIdx + 1);
  if (/\s/.test(query)) return null;
  return query;
}

// ---------------------------------------------------------------------------
// Human-readable size
// ---------------------------------------------------------------------------

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  channelName?: string;
  channelId?: string | null;
  disabled?: boolean;
  onSend: (
    content: string,
    attachments?: ValidatedAttachment[],
    previews?: StagedAttachmentPreview[],
  ) => void;
  /** Called on every keypress (for typing indicator throttling). */
  onKeyPress?: () => void;
  /** Called when the textarea loses focus (to stop typing indicator). */
  onBlur?: () => void;
  /**
   * Server ID for fetching the member list in MentionAutocomplete.
   * Pass null when no server is selected (popover will never open).
   */
  serverId?: string | null;
};

// ---------------------------------------------------------------------------
// StagedTile — individual attachment tile in the staged-preview strip
// ---------------------------------------------------------------------------

type StagedTileProps = {
  staged: StagedFile;
  onRemove: (id: string) => void;
};

function StagedTile({ staged, onRemove }: StagedTileProps) {
  const isImage = staged.contentType.startsWith('image/');
  const { state } = staged;

  const isError = state.phase === 'error';
  const isUploading = state.phase === 'uploading';
  const isDone = state.phase === 'done';

  return (
    <div
      role={isError ? 'alert' : undefined}
      className="relative flex min-w-[200px] max-w-[260px] items-center gap-2 overflow-hidden rounded-md border p-1.5 pr-2"
      style={{
        backgroundColor: '#27272a',
        borderColor: isError ? 'rgba(239,68,68,0.60)' : 'rgba(63,63,70,0.50)',
      }}
    >
      {/* Thumbnail / icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded"
        style={{ backgroundColor: '#1c1c1f' }}
      >
        {isImage && state.localUrl && !isError ? (
          <img src={state.localUrl} alt={staged.filename} className="h-full w-full object-cover" />
        ) : isError ? (
          <WarningCircleIcon size={18} style={{ color: '#f87171' }} />
        ) : (
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#10b981' }}
          >
            {staged.filename.split('.').pop()?.slice(0, 3) ?? '?'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="truncate text-[13px] font-medium leading-tight"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {staged.filename}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1 truncate text-[11px] leading-tight"
          style={{ color: isError ? '#f87171' : 'rgba(255,255,255,0.40)' }}
        >
          {isUploading ? (
            <>
              <SpinnerIcon size={10} className="animate-spin shrink-0" />
              Uploading…
            </>
          ) : isError ? (
            (state as { phase: 'error'; message: string }).message
          ) : isDone ? (
            <>{humanSize(staged.sizeBytes)} · Ready</>
          ) : (
            humanSize(staged.sizeBytes)
          )}
        </span>
      </div>

      {/* Remove button */}
      {!isUploading && (
        <button
          type="button"
          aria-label={`Remove ${staged.filename}`}
          onClick={() => onRemove(staged.id)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          style={{ color: 'rgba(255,255,255,0.40)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.90)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
          }}
        >
          <XIcon size={12} />
        </button>
      )}

      {/* Progress bar (uploading phase) */}
      {isUploading && (
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-full"
          style={{
            width: `${(state as { phase: 'uploading'; progress: number }).progress}%`,
            backgroundColor: '#10b981',
            transition: 'width 200ms ease',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageComposer
// ---------------------------------------------------------------------------

export function MessageComposer({
  channelName,
  channelId,
  disabled = false,
  onSend,
  onKeyPress,
  onBlur,
  serverId = null,
}: Props) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  // Tracks the aria-activedescendant id reported by MentionAutocomplete.
  const [activeDescendantId, setActiveDescendantId] = useState<string | undefined>(undefined);

  // ── Staged attachments ──────────────────────────────────────────────────────
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stable id for the listbox — shared with MentionAutocomplete so aria-controls
  // on the textarea points at the exact same element.
  const rawId = useId();
  const listboxId = `mention-listbox-${rawId.replace(/:/g, '')}`;

  const autocompleteOpen = mentionQuery !== null;

  // Has any tile still uploading or errored?
  const hasBlockingTile = stagedFiles.some(
    (f) => f.state.phase === 'uploading' || f.state.phase === 'error',
  );

  const canSend = value.trim().length > 0 && !disabled && !sending && !hasBlockingTile;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const autoGrow = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  function updateMentionState(newValue: string, cursorPos: number) {
    const query = getMentionQuery(newValue, cursorPos);
    setMentionQuery(query);
  }

  // ---------------------------------------------------------------------------
  // Attachment file selection + client-side guard
  // ---------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Reset so the same file can be re-selected after removal
    e.target.value = '';
    if (files.length === 0) return;

    const newStaged: StagedFile[] = files.map((file) => {
      const id = crypto.randomUUID();
      let errorMsg: string | null = null;

      if (file.size > MAX_ATTACHMENT_BYTES) {
        errorMsg = `Too large (max ${humanSize(MAX_ATTACHMENT_BYTES)})`;
      } else if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
        errorMsg = 'File type not allowed';
      }

      const localUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

      if (errorMsg) {
        return {
          id,
          file,
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          state: { phase: 'error', message: errorMsg, ...withLocalUrl(localUrl) },
        } satisfies StagedFile;
      }

      return {
        id,
        file,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        state: { phase: 'ready', ...withLocalUrl(localUrl) },
      } satisfies StagedFile;
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);
  }

  function removeStagedFile(fileId: string) {
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === fileId);
      // Revoke object URL to avoid memory leaks
      if (target?.state.localUrl) {
        URL.revokeObjectURL(target.state.localUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }

  // ---------------------------------------------------------------------------
  // Upload a single staged file: presign → PUT → confirm → mark done
  // ---------------------------------------------------------------------------

  async function uploadFile(
    staged: StagedFile,
    cid: string,
    updateState: (id: string, updater: (f: StagedFile) => StagedFile) => void,
  ): Promise<ValidatedAttachment | null> {
    // Mark uploading at 0%
    updateState(staged.id, (f) => ({
      ...f,
      state: { phase: 'uploading', progress: 0, ...withLocalUrl(f.state.localUrl) },
    }));

    try {
      // Step 1: presign
      const { uploadUrl, key } = await api.presignAttachment(
        cid,
        staged.contentType,
        staged.filename,
      );

      // Mark progress at 30% (presign done)
      updateState(staged.id, (f) => ({
        ...f,
        state: { phase: 'uploading', progress: 30, ...withLocalUrl(f.state.localUrl) },
      }));

      // Step 2: PUT to storage (no credentials header — goes direct to S3)
      await fetch(uploadUrl, {
        method: 'PUT',
        body: staged.file,
        headers: { 'Content-Type': staged.contentType },
      }).then((res) => {
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      });

      // Mark progress at 80% (PUT done)
      updateState(staged.id, (f) => ({
        ...f,
        state: { phase: 'uploading', progress: 80, ...withLocalUrl(f.state.localUrl) },
      }));

      // Step 3: confirm
      const validated = await api.confirmAttachment(cid, key, staged.filename, staged.contentType);

      // Mark done
      updateState(staged.id, (f) => ({
        ...f,
        state: { phase: 'done', validated, ...withLocalUrl(f.state.localUrl) },
      }));

      return validated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      const shortMsg = msg.length > 40 ? `${msg.slice(0, 37)}…` : msg;
      updateState(staged.id, (f) => ({
        ...f,
        state: { phase: 'error', message: shortMsg, ...withLocalUrl(f.state.localUrl) },
      }));
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  async function handleSend() {
    const content = value.trim();
    if (!content || disabled || sending || hasBlockingTile) return;
    setSending(true);
    try {
      // Upload all ready tiles (already-done tiles keep their validated result)
      const readyFiles = stagedFiles.filter(
        (f) => f.state.phase === 'ready' || f.state.phase === 'done',
      );

      const updateState = (id: string, updater: (f: StagedFile) => StagedFile) => {
        setStagedFiles((prev) => prev.map((f) => (f.id === id ? updater(f) : f)));
      };

      // Run uploads in parallel (safe: each presigns independently)
      const channelIdForUpload = channelId ?? null;
      const uploadResults: (ValidatedAttachment | null)[] =
        readyFiles.length > 0 && channelIdForUpload
          ? await Promise.all(
              readyFiles.map((sf) => {
                if (sf.state.phase === 'done') {
                  return Promise.resolve(
                    (sf.state as { phase: 'done'; validated: ValidatedAttachment }).validated,
                  );
                }
                return uploadFile(sf, channelIdForUpload, updateState);
              }),
            )
          : [];

      // If any upload failed, do not send
      if (uploadResults.some((r) => r === null)) {
        // Tiles are already in error state; user sees the red tiles
        return;
      }

      const validated = uploadResults.filter((r): r is ValidatedAttachment => r !== null);

      // Build staged previews for the optimistic row
      const previews: StagedAttachmentPreview[] = stagedFiles
        .filter((f) => f.state.phase === 'ready' || f.state.phase === 'done')
        .map((f) => ({
          filename: f.filename,
          contentType: f.contentType,
          sizeBytes: f.sizeBytes,
          ...withLocalUrl(f.state.localUrl),
        }));

      onSend(
        content,
        validated.length > 0 ? validated : undefined,
        previews.length > 0 ? previews : undefined,
      );

      // Revoke object URLs to free memory
      for (const f of stagedFiles) {
        if (f.state.localUrl) URL.revokeObjectURL(f.state.localUrl);
      }

      setValue('');
      setStagedFiles([]);
      setMentionQuery(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
    textareaRef.current?.focus();
  }

  // ---------------------------------------------------------------------------
  // @mention selection
  // ---------------------------------------------------------------------------

  const handleMentionSelect = useCallback(
    ({ username }: MentionInsertPayload) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const cursor = ta.selectionStart ?? value.length;
      const textBefore = value.slice(0, cursor);
      // Find the @ that triggered the popover
      const atIdx = textBefore.lastIndexOf('@');
      if (atIdx === -1) return;
      // Replace from @ up to cursor with the resolved mention + trailing space
      const insert = `@${username} `;
      const before = value.slice(0, atIdx);
      const after = value.slice(cursor);
      const newValue = before + insert + after;
      setValue(newValue);
      setMentionQuery(null);
      // Move cursor to just after the inserted text
      const newCursor = atIdx + insert.length;
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursor, newCursor);
        autoGrow();
      });
    },
    [value, autoGrow],
  );

  const handleMentionDismiss = useCallback(() => {
    setMentionQuery(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // When the autocomplete is open, let MentionAutocomplete's document-level
    // keydown listener handle ↑↓/Enter/Escape first (it uses capture phase).
    // We only need to prevent the normal Enter-to-send when autocomplete is open.
    if (autocompleteOpen) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Never send while autocomplete is open
        return;
      }
      if (e.key === 'Escape') {
        // Autocomplete handles Escape in capture phase; nothing needed here.
        return;
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
        return;
      }
    }
    if (onKeyPress) {
      onKeyPress();
    }
  }

  // ---------------------------------------------------------------------------
  // Input change
  // ---------------------------------------------------------------------------

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart ?? newValue.length;
    setValue(newValue);
    autoGrow();
    updateMentionState(newValue, cursor);
  }

  // Also update on click/selection change (user may reposition cursor inside
  // an existing @token).
  function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    updateMentionState(ta.value, ta.selectionStart ?? ta.value.length);
  }

  function handleBlur() {
    // Delay dismissal slightly so click on an autocomplete option fires first.
    setTimeout(() => {
      setMentionQuery(null);
    }, 150);
    if (onBlur) onBlur();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasStagedFiles = stagedFiles.length > 0;

  return (
    <div className="shrink-0 px-5 pb-5 pt-2 relative" aria-label="Message composer">
      {/* Mention autocomplete popover — anchored above the composer form */}
      {autocompleteOpen && serverId && (
        <div
          className="absolute z-20"
          style={{ bottom: 'calc(100% - 8px)', left: 20, right: 20 }}
          aria-label="Mention autocomplete"
        >
          <MentionAutocomplete
            serverId={serverId}
            query={mentionQuery ?? ''}
            onSelect={handleMentionSelect}
            onDismiss={handleMentionDismiss}
            listboxId={listboxId}
            onActiveIdChange={setActiveDescendantId}
          />
        </div>
      )}

      {/* Hidden file input — D-carry: hidden-input pattern for accessible file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileChange}
        data-testid="file-input"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="relative flex flex-col overflow-hidden rounded-md"
        style={{
          backgroundColor: '#27272a',
          border: '1px solid rgba(63,63,70,0.6)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
        }}
      >
        {/* STAGED-PREVIEW STRIP — D-carry: aria-live="polite" */}
        {hasStagedFiles && (
          <div
            aria-live="polite"
            aria-label="Staged attachments"
            className="flex flex-wrap gap-2 overflow-y-auto px-3 pb-1 pt-3"
            style={{ maxHeight: 160 }}
            data-testid="staged-attachment-strip"
          >
            {stagedFiles.map((sf) => (
              <StagedTile key={sf.id} staged={sf} onRemove={removeStagedFile} />
            ))}
          </div>
        )}

        {/* INPUT ROW */}
        <div className="flex items-end w-full">
          {/* Attach button — left of textarea */}
          <div className="flex shrink-0 items-center self-stretch p-2.5 pr-1">
            <button
              type="button"
              aria-label="Attach file"
              disabled={disabled || sending}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              onMouseEnter={(e) => {
                if (!disabled && !sending) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3f3f46';
                  (e.currentTarget as HTMLButtonElement).style.color = '#10b981';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.40)';
              }}
              data-testid="attach-button"
            >
              <PaperclipIcon size={20} />
            </button>
          </div>

          <label htmlFor="composer-input" className="sr-only">
            Message {channelName ? `#${channelName}` : 'channel'}
          </label>
          <textarea
            ref={textareaRef}
            id="composer-input"
            data-testid="composer-input"
            rows={1}
            placeholder={`Message ${channelName ? `#${channelName}` : 'channel'}`}
            value={value}
            disabled={disabled || sending}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onBlur={handleBlur}
            // --- Combobox ARIA (WAI-ARIA 1.2 §combo-with-list) ---
            role={serverId ? 'combobox' : undefined}
            aria-autocomplete={serverId ? 'list' : undefined}
            aria-expanded={autocompleteOpen || undefined}
            aria-controls={autocompleteOpen ? listboxId : undefined}
            aria-activedescendant={autocompleteOpen ? activeDescendantId : undefined}
            className="w-full bg-transparent text-[14px] outline-none resize-none overflow-y-auto"
            style={{
              color: 'rgba(255,255,255,0.92)',
              caretColor: '#10b981',
              padding: '14px 16px 14px 0',
              minHeight: '48px',
              maxHeight: '40dvh',
              lineHeight: '1.5',
            }}
          />

          <div
            className="flex shrink-0 items-center self-stretch p-2.5"
            style={{ paddingBottom: '10px' }}
          >
            <button
              type="submit"
              data-testid="send-button"
              disabled={!canSend}
              aria-label="Send message"
              className="w-9 h-9 flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: canSend ? '#10b981' : '#27272a',
                color: canSend ? '#0a0a0b' : 'rgba(255,255,255,0.30)',
                cursor: canSend ? 'pointer' : 'not-allowed',
                border: canSend ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {sending ? (
                <SpinnerIcon size={18} className="animate-spin" />
              ) : (
                <PaperPlaneIcon size={18} />
              )}
            </button>
          </div>
        </div>
      </form>

      <div
        className="text-[11px] mt-2 px-1 flex justify-between tracking-wide"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      >
        <span>
          {autocompleteOpen ? (
            <>
              <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Enter
              </kbd>{' '}
              to insert &nbsp;·&nbsp;{' '}
              <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
                ↑↓
              </kbd>{' '}
              to navigate
            </>
          ) : (
            <>
              <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Enter
              </kbd>{' '}
              to send &nbsp;·&nbsp;{' '}
              <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Shift
              </kbd>
              +
              <kbd className="font-sans" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Enter
              </kbd>{' '}
              for newline
            </>
          )}
        </span>
      </div>
    </div>
  );
}
