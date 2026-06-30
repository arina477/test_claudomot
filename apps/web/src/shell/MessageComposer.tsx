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
 * A11y (combobox pattern — WAI-ARIA 1.2 §combo-with-list):
 * - The textarea carries role=combobox + aria-expanded + aria-controls
 *   (pointing at the listbox id) + aria-activedescendant (the focused option id).
 * - The listbox div + option divs live in MentionAutocomplete; they do NOT
 *   carry aria-activedescendant and do NOT need to be focusable.
 */

import { useCallback, useId, useRef, useState } from 'react';
import type { MentionInsertPayload } from './MentionAutocomplete';
import { MentionAutocomplete } from './MentionAutocomplete';
import { PaperPlaneIcon, SpinnerIcon } from './icons';

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
// Props
// ---------------------------------------------------------------------------

type Props = {
  channelName?: string;
  disabled?: boolean;
  onSend: (content: string) => void;
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
// MessageComposer
// ---------------------------------------------------------------------------

export function MessageComposer({
  channelName,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stable id for the listbox — shared with MentionAutocomplete so aria-controls
  // on the textarea points at the exact same element.
  const rawId = useId();
  const listboxId = `mention-listbox-${rawId.replace(/:/g, '')}`;

  const autocompleteOpen = mentionQuery !== null;
  const canSend = value.trim().length > 0 && !disabled && !sending;

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
  // Send
  // ---------------------------------------------------------------------------

  async function handleSend() {
    const content = value.trim();
    if (!content || disabled || sending) return;
    setSending(true);
    try {
      onSend(content);
      setValue('');
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="relative flex items-end rounded-md overflow-hidden"
        style={{
          backgroundColor: '#27272a',
          border: '1px solid rgba(63,63,70,0.6)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)',
        }}
      >
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
          // Focus stays on this textarea at all times while the popover is open.
          // aria-activedescendant + aria-controls + role=combobox all live here
          // (on the focusable element), NOT on the listbox.
          role={serverId ? 'combobox' : undefined}
          aria-autocomplete={serverId ? 'list' : undefined}
          aria-expanded={autocompleteOpen || undefined}
          aria-controls={autocompleteOpen ? listboxId : undefined}
          aria-activedescendant={autocompleteOpen ? activeDescendantId : undefined}
          className="w-full bg-transparent text-[14px] outline-none resize-none overflow-y-auto"
          style={{
            color: 'rgba(255,255,255,0.92)',
            caretColor: '#10b981',
            padding: '14px 16px',
            minHeight: '48px',
            maxHeight: '40dvh',
            lineHeight: '1.5',
          }}
        />
        <div
          className="p-2.5 flex items-center shrink-0 self-stretch"
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
