/**
 * UserMenu — a small popover menu anchored to the "Your profile and settings"
 * button in ChannelSidebar's bottom user panel.
 *
 * Opens UPWARD from the sidebar footer. Reuses the MessageList AddReactionPopover
 * pattern: popoverRef + anchorRef, mousedown outside-click listener, Escape-key
 * handler that closes AND returns focus to the trigger.
 *
 * Three menuitems:
 *   Profile  → navigate('/settings/profile') then close
 *   Privacy  → navigate('/settings/privacy') then close
 *   Log out  → Session.signOut() then navigate('/login') then close
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Session from 'supertokens-auth-react/recipe/session';
import { GearIcon, LockKeyIcon, SignOutIcon } from './icons';

type UserMenuProps = {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
};

export function UserMenu({ anchorRef, onClose }: UserMenuProps) {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside mousedown or Escape; Escape also returns focus to trigger
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        anchorRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, anchorRef]);

  function handleSelect(action: () => void | Promise<void>) {
    return async () => {
      onClose();
      await action();
    };
  }

  const items: MenuItem[] = [
    {
      label: 'Profile',
      icon: <GearIcon size={14} />,
      action: () => {
        navigate('/settings/profile');
      },
    },
    {
      label: 'Privacy',
      icon: <LockKeyIcon size={14} />,
      action: () => {
        navigate('/settings/privacy');
      },
    },
    {
      label: 'Log out',
      icon: <SignOutIcon size={14} />,
      action: async () => {
        await Session.signOut();
        navigate('/login');
      },
    },
  ];

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="User menu"
      style={{
        position: 'absolute',
        bottom: '68px', // above the 60px footer + 8px gap
        left: '8px',
        zIndex: 50,
        minWidth: 180,
        backgroundColor: '#27272a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.40)',
        padding: '4px',
      }}
    >
      {items.map(({ label, icon, action }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          onClick={handleSelect(action)}
          className="flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] cursor-pointer transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2"
          style={{
            color: label === 'Log out' ? 'rgba(239,68,68,0.90)' : 'rgba(255,255,255,0.80)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              label === 'Log out' ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor =
              label === 'Log out' ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.06)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span aria-hidden="true" style={{ flexShrink: 0 }}>
            {icon}
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
