/**
 * MessageComposer — auto-grow textarea + send button.
 *
 * - Enter = send, Shift+Enter = newline (design spec §8 MessageComposer).
 * - Send button disabled when empty or when sending.
 * - Calls onSend(content) → parent owns optimistic state.
 * - Clears textarea on send.
 */

import { useRef, useState } from 'react';
import { PaperPlaneIcon, SpinnerIcon } from './icons';

type Props = {
  channelName?: string;
  disabled?: boolean;
  onSend: (content: string) => void;
};

export function MessageComposer({ channelName, disabled = false, onSend }: Props) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled && !sending;

  function autoGrow() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }

  async function handleSend() {
    const content = value.trim();
    if (!content || disabled || sending) return;
    setSending(true);
    try {
      onSend(content);
      setValue('');
      // Reset height after clearing
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="shrink-0 px-5 pb-5 pt-2" aria-label="Message composer">
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
          onChange={(e) => {
            setValue(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
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
        </span>
      </div>
    </div>
  );
}
