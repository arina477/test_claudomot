/**
 * ServerRolesPage — Roles Management surface for a server.
 *
 * Design: design/server-roles.html (D-3 APPROVED)
 *
 * Layout: Settings shell (sidebar nav + main area split).
 *   Left: roles nav rail — Owner (immutable), custom roles list, + create button.
 *   Right: role editor — name input, 4 permission flags, channel visibility overrides.
 *   Bottom: member assignment table (assign single role per member via select).
 *
 * States: loading / loaded / empty (no custom roles) / saving / load-error / save-409-reject.
 *
 * A11y carry-forwards (D-3 5 must-fix):
 *   (1) Visibility toggle track: visible bg color when OFF (not transparent), Visible/Hidden text.
 *   (2) "Private" text marker on default-deny channels.
 *   (3) prefers-reduced-motion + DS-aligned type sizes.
 *   (4) Modal Tab focus-trap in React.
 *   (5) Gating is convenience-only — server enforces; 403 handled gracefully.
 *
 * Gating: caller's permissions are derived from whether the server's ownerId matches
 * the current user's ID (full permissions) or from a `canManageRoles` / `canManageMembers`
 * / `canManageChannels` prop derived from the server roles check. We optimistically show
 * controls and handle 403 gracefully as the server always enforces.
 */

import type { ChannelOverride, ChannelSummary, Role, RolePermissions } from '@studyhall/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../auth/api';
import {
  CaretRightIcon,
  CrownIcon,
  EyeSlashIcon,
  LockKeyIcon,
  PlusIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  TrashIcon,
  WarningCircleIcon,
  WarningIcon,
  XIcon,
} from './icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServerRolesPageProps = {
  serverId: string;
  serverName: string;
  /** ownerId of the server. */
  ownerId: string;
  /** Flat channel list from ServerDetail. */
  channels: ChannelSummary[];
  onClose: () => void;
};

type Toast = {
  id: string;
  message: string;
  kind: 'success' | 'error';
};

type PermFlag = keyof RolePermissions;

const PERM_FLAGS: { key: PermFlag; label: string; description: string; sensitive?: true }[] = [
  {
    key: 'manage_server',
    label: 'Manage Server',
    description: 'Edit server name, region, and top-level settings.',
  },
  {
    key: 'manage_roles',
    label: 'Manage Roles',
    description: 'Create, edit, and assign roles. Removing this may trigger the owner safeguard.',
    sensitive: true,
  },
  {
    key: 'manage_channels',
    label: 'Manage Channels',
    description: 'Create new channels, rename existing ones, or delete categories.',
  },
  {
    key: 'manage_members',
    label: 'Manage Members',
    description: 'Kick, ban, or assign roles to other members.',
  },
];

// ---------------------------------------------------------------------------
// Toast hook
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
// FocusTrap — a11y carry-forward (4): modal focus trap
// ---------------------------------------------------------------------------

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const container = containerRef.current;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([aria-disabled="true"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.closest('[aria-hidden="true"]'));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
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
    };

    container.addEventListener('keydown', handleKeyDown);
    // Auto-focus first focusable
    const focusable = getFocusable();
    const firstEl = focusable[0];
    if (firstEl) firstEl.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, containerRef]);
}

// ---------------------------------------------------------------------------
// CreateRoleModal
// ---------------------------------------------------------------------------

type CreateRoleModalProps = {
  onClose: () => void;
  onCreated: (role: Role) => void;
  serverId: string;
};

function CreateRoleModal({ onClose, onCreated, serverId }: CreateRoleModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, containerRef);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createRole(serverId, { name: trimmed });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
      setSaving(false);
    }
  }

  return (
    <div // biome-ignore lint/a11y/useSemanticElements: div with role="dialog" — native <dialog> requires show/close API
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-title"
    >
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close is a progressive enhancement; Escape key handled separately */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="relative z-10 flex w-full max-w-md flex-col rounded-xl border shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        style={{
          background: '#121214',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h2 id="modal-create-title" className="text-base font-semibold text-white">
            Create New Role
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="new-role-name" className="block text-[13px] font-medium text-white/90">
              Role Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="new-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              placeholder="E.g., Moderators"
              className="h-10 w-full rounded-md border px-3 text-[13px] text-white transition-colors"
              style={{
                background: '#0a0a0b',
                borderColor: 'rgba(255,255,255,0.06)',
                outline: 'none',
              }}
              autoComplete="off"
            />
          </div>
          {error && (
            <p className="text-[13px]" style={{ color: '#ef4444' }} role="alert">
              {error}
            </p>
          )}
        </div>

        <div
          className="flex items-center justify-end gap-3 rounded-b-xl border-t px-6 py-4"
          style={{ background: 'rgba(10,10,11,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            aria-disabled={!name.trim() ? 'true' : undefined}
            className="flex h-10 min-w-[100px] items-center justify-center rounded-md px-5 text-[13px] font-semibold transition-colors disabled:opacity-50"
            style={{ background: '#10b981', color: '#0a0a0b' }}
          >
            {saving ? <SpinnerIcon size={16} className="animate-spin" /> : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeleteRoleModal
// ---------------------------------------------------------------------------

type DeleteRoleModalProps = {
  roleName: string;
  onClose: () => void;
  onDeleted: () => void;
  serverId: string;
  roleId: string;
};

function DeleteRoleModal({ roleName, onClose, onDeleted, serverId, roleId }: DeleteRoleModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, containerRef);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      await api.deleteRole(serverId, roleId);
      onDeleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete role';
      if (msg.includes('409')) {
        setError('Cannot delete this role — it is the last owner role (owner-protection active).');
      } else {
        setError(msg);
      }
      setSaving(false);
    }
  }

  return (
    <div // biome-ignore lint/a11y/useSemanticElements: div with role="dialog" — native <dialog> requires show/close API
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-title"
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-close is a progressive enhancement; Escape key handled separately */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className="relative z-10 flex w-full max-w-sm flex-col rounded-xl border shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="relative border-b px-6 py-5 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <WarningIcon size={20} style={{ color: '#ef4444' }} />
          </div>
          <h2 id="modal-delete-title" className="text-base font-semibold text-white">
            Delete Role?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          className="px-6 py-4 text-center text-[13px] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          Are you sure you want to delete <span className="font-bold text-white">@{roleName}</span>?
          This action cannot be undone, and members will lose these permissions immediately.
        </div>

        {error && (
          <div
            className="mx-6 mb-2 rounded border px-4 py-3 text-[13px]"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.3)',
              color: '#ef4444',
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div
          className="flex gap-3 rounded-b-xl border-t px-6 py-4"
          style={{ background: 'rgba(10,10,11,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-md border text-[13px] font-medium text-white transition-colors hover:bg-white/10"
            style={{ background: '#27272a', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="flex h-10 min-w-[100px] flex-1 items-center justify-center rounded-md border text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: '#ef4444', borderColor: 'rgba(239,68,68,0.5)' }}
          >
            {saving ? <SpinnerIcon size={16} className="animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VisibilityToggle — a11y carry-forward (1): visible track + Visible/Hidden text
// ---------------------------------------------------------------------------

type VisibilityToggleProps = {
  channelId: string;
  channelName: string;
  channelType: string;
  isPrivate?: boolean;
  canView: boolean | null; // null = no override (server default)
  isDefault?: boolean; // is this the server default-deny channel?
  onChange: (canView: boolean) => void;
  disabled?: boolean;
};

function VisibilityToggle({
  channelId,
  channelName,
  channelType,
  isPrivate,
  canView,
  onChange,
  disabled,
}: VisibilityToggleProps) {
  const checked = canView === true;
  const inputId = `ch-vis-${channelId}`;

  return (
    <label
      className="flex min-h-[44px] cursor-pointer items-center justify-between p-3 transition-colors"
      style={
        {
          // a11y fix (2): Private channels get explicit "Private" text marker via aria-label on the row
        }
      }
      htmlFor={inputId}
    >
      <div className="flex items-center gap-3">
        {/* Channel icon */}
        <span aria-hidden="true" className="text-lg" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {channelType === 'voice' ? '🔊' : '#'}
        </span>
        <span
          className="font-mono text-[13px] font-medium tracking-tight"
          style={{ color: canView === false ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.92)' }}
        >
          {channelName}
        </span>
        {/* a11y fix (2): Explicit "Private" text for default-deny channels */}
        {isPrivate && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}
            aria-label="Private channel"
          >
            Private
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Visible/Hidden text — a11y fix (1) */}
        <span
          className="text-xs font-medium"
          aria-hidden="true"
          style={{ color: checked ? '#10b981' : 'rgba(255,255,255,0.40)' }}
        >
          {checked ? 'Visible' : 'Hidden'}
        </span>
        {/* Toggle — a11y fix (1): track has solid background in both states */}
        <div className="relative">
          <input
            type="checkbox"
            id={inputId}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            aria-label={`Can view ${channelName} channel (${checked ? 'Visible' : 'Hidden'})`}
            className="sr-only"
          />
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: aria-hidden presentation div mirrors the hidden <input>; a11y interaction is via the checkbox */}
          <div
            onClick={() => !disabled && onChange(!checked)}
            role="presentation"
            aria-hidden="true"
            className="flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200"
            style={{
              // a11y fix (1): OFF state has a visible, non-transparent track (zinc-600)
              background: checked ? '#10b981' : '#52525b',
              border: `1px solid ${checked ? '#10b981' : '#3f3f46'}`,
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span
              className="h-4 w-4 rounded-full transition-transform duration-200"
              style={{
                background: 'white',
                transform: checked ? 'translateX(18px)' : 'translateX(2px)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// PermissionFlag row
// ---------------------------------------------------------------------------

type PermFlagRowProps = {
  flagKey: PermFlag;
  label: string;
  description: string;
  sensitive?: true;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  lockedReason?: string;
};

function PermFlagRow({
  flagKey,
  label,
  description,
  sensitive,
  checked,
  onChange,
  disabled,
  lockedReason,
}: PermFlagRowProps) {
  const inputId = `perm-${flagKey}`;
  const descId = `perm-desc-${flagKey}`;

  return (
    <div
      className="relative flex min-h-[44px] items-start justify-between overflow-hidden rounded-lg border p-4 transition-colors"
      style={{
        background: 'rgba(18,18,20,0.5)',
        borderColor: sensitive ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {sensitive && (
        <div
          className="absolute bottom-0 left-0 top-0 w-0.5"
          style={{ background: 'rgba(245,158,11,0.5)' }}
        />
      )}
      <div className="flex flex-col pr-4" style={{ paddingLeft: sensitive ? '4px' : undefined }}>
        <span className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
          {label}
          {sensitive && (
            <>
              <WarningIcon size={14} style={{ color: '#f59e0b' }} aria-hidden="true" />
              <span className="sr-only">Caution: removing this alters owner protections</span>
            </>
          )}
          {disabled && lockedReason && (
            <LockKeyIcon size={10} style={{ color: 'rgba(255,255,255,0.40)' }} aria-hidden="true" />
          )}
        </span>
        <span
          id={descId}
          className="text-[13px] leading-snug"
          style={{ color: 'rgba(255,255,255,0.60)' }}
        >
          {description}
        </span>
        {disabled && lockedReason && (
          <span id={`perm-gated-${flagKey}`} className="sr-only">
            {lockedReason}
          </span>
        )}
      </div>
      {/* Toggle */}
      <div className="relative shrink-0 mt-1">
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          aria-describedby={`${descId}${disabled && lockedReason ? ` perm-gated-${flagKey}` : ''}`}
          className="sr-only"
        />
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: aria-hidden presentation div mirrors the hidden <input>; a11y interaction is via the checkbox */}
        <div
          onClick={() => !disabled && onChange(!checked)}
          role="presentation"
          aria-hidden="true"
          className="flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200"
          style={{
            background: checked ? '#10b981' : '#52525b',
            border: `1px solid ${checked ? '#10b981' : '#3f3f46'}`,
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <span
            className="h-4 w-4 rounded-full transition-transform duration-200"
            style={{
              background: 'white',
              transform: checked ? 'translateX(18px)' : 'translateX(2px)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServerRolesPage({
  serverId,
  serverName,
  ownerId,
  channels,
  onClose,
}: ServerRolesPageProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMe()
      .then((me) => setCurrentUserId(me.userId))
      .catch(() => null);
  }, []);

  const isOwner = currentUserId !== null && currentUserId === ownerId;

  // ── Roles load state ────────────────────────────────────────────────────
  type LoadStatus = 'loading' | 'loaded' | 'error';
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // ── Edit buffer for selected role ───────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editPerms, setEditPerms] = useState<RolePermissions>({
    manage_server: false,
    manage_roles: false,
    manage_channels: false,
    manage_members: false,
    manage_assignments: false,
  });
  const [overrides, setOverrides] = useState<ChannelOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // ── Save state ──────────────────────────────────────────────────────────
  type SaveStatus = 'idle' | 'saving' | 'error' | 'conflict';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Modals ──────────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // ── Member assignment ───────────────────────────────────────────────────
  // Members are not exposed by the current API — show a placeholder until
  // GET /servers/:id/members is available.
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // ── Toasts ──────────────────────────────────────────────────────────────
  const { toasts, addToast } = useToasts();

  // ── Load roles ──────────────────────────────────────────────────────────
  const loadRoles = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const list = await api.listRoles(serverId);
      setRoles(list);
      setLoadStatus('loaded');
      // Auto-select first non-default role (or first role if all default)
      const firstCustom = list.find((r) => !r.isDefault);
      const autoSelect = firstCustom ?? list[0] ?? null;
      setSelectedRoleId(autoSelect?.id ?? null);
    } catch {
      setLoadStatus('error');
    }
  }, [serverId]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  // ── Populate edit buffer when selected role changes ─────────────────────
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  useEffect(() => {
    if (!selectedRole) return;
    setEditName(selectedRole.name);
    setEditPerms({ ...selectedRole.permissions });
    setDirty(false);
    setSaveStatus('idle');
    setSaveError(null);
  }, [selectedRole]);

  // ── Load channel overrides for selected role ────────────────────────────
  useEffect(() => {
    if (!selectedRoleId || channels.length === 0) {
      setOverrides([]);
      return;
    }
    setOverridesLoading(true);
    // Load overrides per channel for this role
    Promise.all(
      channels.map((ch) =>
        api.listChannelOverrides(serverId, ch.id).catch(() => [] as ChannelOverride[]),
      ),
    ).then((results) => {
      const flat = results.flat().filter((o) => o.roleId === selectedRoleId);
      setOverrides(flat);
      setOverridesLoading(false);
    });
  }, [selectedRoleId, serverId, channels]);

  // ── Edit handlers ────────────────────────────────────────────────────────

  function handlePermChange(key: PermFlag, value: boolean) {
    setEditPerms((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleNameChange(v: string) {
    setEditName(v);
    setDirty(true);
  }

  // ── Channel override toggle ─────────────────────────────────────────────

  async function handleVisibilityToggle(channelId: string, canView: boolean) {
    if (!selectedRoleId) return;
    const original = [...overrides];
    // Optimistic update
    setOverrides((prev) => {
      const existing = prev.find((o) => o.channelId === channelId);
      if (existing) {
        return prev.map((o) => (o.channelId === channelId ? { ...o, canView } : o));
      }
      return [
        ...prev,
        {
          id: `temp-${channelId}`,
          channelId,
          roleId: selectedRoleId,
          canView,
        },
      ];
    });
    try {
      const result = await api.upsertChannelOverride(serverId, channelId, {
        roleId: selectedRoleId,
        canView,
      });
      // Replace temp with real
      setOverrides((prev) =>
        prev.map((o) => (o.channelId === channelId && o.roleId === selectedRoleId ? result : o)),
      );
      addToast('Channel visibility updated.', 'success');
    } catch (err) {
      setOverrides(original);
      const msg = err instanceof Error ? err.message : 'Failed to update visibility';
      if (msg.includes('403')) {
        addToast('Not allowed: manage_channels permission required.', 'error');
      } else {
        addToast(msg, 'error');
      }
    }
  }

  // ── Save role (name + permissions) ─────────────────────────────────────

  async function handleSave() {
    if (!selectedRoleId || !dirty) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const updated = await api.updateRole(serverId, selectedRoleId, {
        name: editName.trim() || undefined,
        ...editPerms,
      });
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDirty(false);
      setSaveStatus('idle');
      addToast('Roles configuration saved.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      if (msg.includes('409')) {
        setSaveStatus('conflict');
        setSaveError('Save rejected by server — last-owner protection constraint.');
        addToast('Save Refused. Last-owner flag cannot be removed.', 'error');
      } else if (msg.includes('403')) {
        setSaveStatus('error');
        setSaveError('Not allowed: manage_roles permission required.');
        addToast('Permission denied.', 'error');
      } else {
        setSaveStatus('error');
        setSaveError(msg);
        addToast(msg, 'error');
      }
    }
  }

  function handleDiscard() {
    if (!selectedRole) return;
    setEditName(selectedRole.name);
    setEditPerms({ ...selectedRole.permissions });
    setDirty(false);
    setSaveStatus('idle');
    setSaveError(null);
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const customRoles = roles.filter((r) => !r.isDefault);
  const hasCustomRoles = customRoles.length > 0;

  // ── Keyboard close ────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !createModalOpen && !deleteModalOpen) onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose, createModalOpen, deleteModalOpen]);

  // ── a11y fix (3): prefers-reduced-motion ─────────────────────────────────
  const motionOk = useRef(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : true,
  );

  return (
    <>
      {/* Modals */}
      {createModalOpen && (
        <CreateRoleModal
          serverId={serverId}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(role) => {
            setRoles((prev) => [...prev, role]);
            setSelectedRoleId(role.id);
            setCreateModalOpen(false);
            addToast('Role created successfully.', 'success');
          }}
        />
      )}
      {deleteModalOpen && selectedRole && (
        <DeleteRoleModal
          serverId={serverId}
          roleId={selectedRole.id}
          roleName={selectedRole.name}
          onClose={() => setDeleteModalOpen(false)}
          onDeleted={() => {
            setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id));
            setSelectedRoleId(null);
            setDeleteModalOpen(false);
            addToast('Role deleted.', 'success');
          }}
        />
      )}

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
              display: 'flex',
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

      {/* Full-screen settings shell */}
      <div
        className="fixed inset-0 z-40 flex" // biome-ignore lint/a11y/useSemanticElements: settings shell uses role="dialog" — native <dialog> requires show/close API
        style={{ background: '#0a0a0b' }}
        role="dialog"
        aria-modal="true"
        aria-label={`${serverName} — Roles Management`}
        data-testid="server-roles-page"
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
              style={{
                background: '#1c1c1f',
                borderColor: 'rgba(255,255,255,0.10)',
              }}
              aria-hidden="true"
            >
              <ShieldCheckIcon size={20} style={{ color: 'rgba(255,255,255,0.60)' }} />
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

          <nav className="flex-1 overflow-y-auto p-3" aria-label="Settings sections">
            {/* Active: Roles */}
            <a
              href="#roles-content"
              className="relative flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium transition-all"
              style={{
                color: '#10b981',
                background: 'rgba(16,185,129,0.10)',
              }}
              aria-current="page"
            >
              <div
                className="absolute left-0 top-1/2 h-3/5 w-1 -translate-y-1/2 rounded-r-full"
                style={{ background: '#10b981' }}
                aria-hidden="true"
              />
              <ShieldCheckIcon size={18} />
              Roles
            </a>
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
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
                {isOwner ? 'OW' : 'ME'}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {isOwner ? 'Owner' : 'Member'}
            </span>
          </div>
        </aside>

        {/* Main content */}
        <main
          id="roles-content"
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
            <h1 className="text-lg font-semibold tracking-tight text-white">Roles Management</h1>
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
            <div className="mx-auto flex w-full max-w-[1100px] flex-col pb-16">
              {/* Gating note */}
              <p
                className="mb-6 flex items-center gap-2.5 text-sm"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                <ShieldCheckIcon
                  size={16}
                  style={{ color: 'rgba(82,82,91,1)' }}
                  aria-hidden="true"
                />
                You only see controls you&apos;re allowed to use. Permissions are always enforced on
                the server.
              </p>

              {/* STATE: LOADING */}
              {loadStatus === 'loading' && (
                <div
                  className="flex flex-col gap-6 w-full"
                  aria-label="Loading roles"
                  aria-live="polite"
                  data-testid="roles-loading"
                >
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 w-full rounded-lg border"
                      style={{
                        background: '#121214',
                        borderColor: 'rgba(255,255,255,0.06)',
                        ...(motionOk.current ? { animation: 'pulse 2s infinite' } : {}),
                      }}
                    />
                  ))}
                </div>
              )}

              {/* STATE: LOAD ERROR */}
              {loadStatus === 'error' && (
                <div
                  className="flex flex-col items-center justify-center py-32 px-4 text-center"
                  data-testid="roles-load-error"
                >
                  <div
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      borderColor: 'rgba(239,68,68,0.2)',
                    }}
                  >
                    <WarningCircleIcon size={32} style={{ color: '#ef4444' }} />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-white">
                    Couldn&apos;t load roles
                  </h2>
                  <p
                    className="mx-auto mb-6 max-w-sm text-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.40)' }}
                  >
                    Check your connection and try again.
                  </p>
                  <button
                    type="button"
                    onClick={loadRoles}
                    className="flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    style={{ background: '#1c1c1f', borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* STATE: LOADED (empty — no custom roles) */}
              {loadStatus === 'loaded' && !hasCustomRoles && (
                <div
                  className="flex flex-col items-center justify-center border-t border-dashed px-4 py-24 text-center"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  data-testid="roles-empty"
                >
                  <div
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border"
                    style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <ShieldCheckIcon size={40} style={{ color: '#3f3f46' }} />
                  </div>
                  <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                    No Custom Roles Yet
                  </h2>
                  <p
                    className="mx-auto mb-8 max-w-md text-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.60)' }}
                  >
                    No custom roles yet — only the default Member role. Create a role to get started
                    and delegate access.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="mx-auto flex min-h-[44px] items-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors hover:opacity-90"
                    style={{ background: '#10b981', color: '#0a0a0b' }}
                    data-testid="create-first-role-btn"
                  >
                    <PlusIcon size={16} /> Create First Role
                  </button>
                </div>
              )}

              {/* STATE: LOADED with roles */}
              {loadStatus === 'loaded' && hasCustomRoles && (
                <div className="flex flex-col gap-6 w-full" data-testid="roles-loaded">
                  {/* Last-owner safeguard banner */}
                  <div
                    className="flex items-start gap-3.5 rounded-lg border p-4 shadow-sm"
                    style={{
                      background: '#121214',
                      borderColor: 'rgba(245,158,11,0.30)',
                      borderLeftWidth: '4px',
                      borderLeftColor: '#f59e0b',
                    }}
                    aria-live="polite"
                  >
                    <WarningIcon
                      size={18}
                      style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <h3 className="mb-0.5 text-sm font-semibold" style={{ color: '#f59e0b' }}>
                        Last-Owner Safeguard Active
                      </h3>
                      <p className="max-w-3xl text-[13px] leading-relaxed text-white">
                        You cannot save changes that would lock you out of this server as the owner.
                        The system will reject actions that demote your master privileges.
                      </p>
                    </div>
                  </div>

                  {/* 409 inline error */}
                  {saveStatus === 'conflict' && saveError && (
                    <div
                      className="flex items-start gap-3.5 rounded-lg border p-4"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        borderColor: 'rgba(239,68,68,0.3)',
                      }}
                      role="alert"
                      aria-live="assertive"
                      data-testid="save-409-error"
                    >
                      <WarningCircleIcon
                        size={18}
                        style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <h3 className="mb-0.5 text-sm font-semibold" style={{ color: '#ef4444' }}>
                          Save Rejected by Server
                        </h3>
                        <p className="text-[13px] leading-relaxed text-white">{saveError}</p>
                      </div>
                    </div>
                  )}

                  {/* Split pane */}
                  <div
                    className="grid min-h-[500px] grid-cols-1 gap-6 lg:grid-cols-12"
                    style={{
                      opacity: saveStatus === 'saving' ? 0.6 : 1,
                      transition: 'opacity 0.3s',
                    }}
                  >
                    {/* Left: roles nav rail */}
                    <section
                      className="flex h-fit flex-col overflow-hidden rounded-xl border shadow-sm lg:sticky lg:top-8 lg:col-span-4 xl:col-span-3"
                      style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.06)' }}
                      aria-label="Roles list"
                    >
                      <div
                        className="flex items-center justify-between border-b p-4"
                        style={{
                          background: 'rgba(10,10,11,0.20)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <h2 className="text-sm font-semibold text-white">
                          Roles{' '}
                          <span
                            className="ml-1 font-normal"
                            style={{ color: 'rgba(255,255,255,0.40)' }}
                          >
                            {customRoles.length}/20
                          </span>
                        </h2>
                        <button
                          type="button"
                          onClick={() => setCreateModalOpen(true)}
                          aria-label="Add Role"
                          className="flex h-8 w-8 items-center justify-center rounded border transition-colors hover:bg-white/10 hover:text-white"
                          style={{
                            background: '#27272a',
                            borderColor: 'rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.60)',
                          }}
                          data-testid="add-role-btn"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>

                      <ul className="space-y-1 p-2" aria-label="Server Roles Navigation">
                        {/* Owner role — always immutable */}
                        <li>
                          <button
                            type="button"
                            aria-disabled="true"
                            className="flex min-h-[44px] w-full cursor-not-allowed items-center justify-between rounded-md px-3 py-2.5 opacity-60 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: '#f59e0b' }}
                                aria-hidden="true"
                              />
                              <span
                                className="truncate text-sm font-medium"
                                style={{ color: 'rgba(255,255,255,0.92)' }}
                              >
                                @Owner
                              </span>
                            </div>
                            <CrownIcon size={13} style={{ color: 'rgba(255,255,255,0.40)' }} />
                            <span className="sr-only">Read-only superuser role</span>
                          </button>
                        </li>

                        {/* Custom roles */}
                        {customRoles.map((role) => {
                          const isSelected = role.id === selectedRoleId;
                          return (
                            <li key={role.id}>
                              <button
                                type="button"
                                aria-current={isSelected ? 'true' : undefined}
                                onClick={() => setSelectedRoleId(role.id)}
                                className="relative flex min-h-[44px] w-full items-center justify-between rounded-md px-3 py-2.5 transition-colors"
                                style={{
                                  background: isSelected ? '#27272a' : 'transparent',
                                  border: isSelected
                                    ? '1px solid rgba(255,255,255,0.06)'
                                    : '1px solid transparent',
                                }}
                                data-testid={`role-item-${role.id}`}
                              >
                                {isSelected && (
                                  <div
                                    className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full"
                                    style={{ background: '#10b981' }}
                                    aria-hidden="true"
                                  />
                                )}
                                <div className="flex items-center gap-3 pl-1">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: '#10b981' }}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className="truncate text-sm font-medium"
                                    style={{
                                      color: isSelected ? 'white' : 'rgba(255,255,255,0.60)',
                                    }}
                                  >
                                    @{role.name}
                                  </span>
                                </div>
                                <CaretRightIcon
                                  size={12}
                                  style={{
                                    color: 'rgba(255,255,255,0.40)',
                                    opacity: isSelected ? 1 : 0,
                                  }}
                                />
                              </button>
                            </li>
                          );
                        })}

                        {/* Default member role */}
                        {roles
                          .filter((r) => r.isDefault)
                          .map((role) => (
                            <li key={role.id}>
                              <button
                                type="button"
                                aria-current={role.id === selectedRoleId ? 'true' : undefined}
                                onClick={() => setSelectedRoleId(role.id)}
                                className="flex min-h-[44px] w-full items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-white/5"
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border"
                                    style={{
                                      background: 'transparent',
                                      borderColor: 'rgba(255,255,255,0.20)',
                                    }}
                                    aria-hidden="true"
                                  />
                                  <span
                                    className="truncate text-sm font-medium"
                                    style={{ color: 'rgba(255,255,255,0.60)' }}
                                  >
                                    @{role.name}
                                  </span>
                                </div>
                              </button>
                            </li>
                          ))}
                      </ul>

                      <div
                        className="mt-auto border-t p-4"
                        style={{
                          background: 'rgba(10,10,11,0.30)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <p
                          className="text-center text-xs leading-relaxed"
                          style={{ color: 'rgba(255,255,255,0.40)' }}
                        >
                          Roles lower in the list inherit priorities naturally.
                        </p>
                      </div>
                    </section>

                    {/* Right: role editor */}
                    {selectedRole ? (
                      <section
                        className="relative flex h-full max-h-[700px] shrink-0 flex-col overflow-hidden rounded-xl border shadow-sm lg:col-span-8 xl:col-span-9"
                        style={{ background: '#1c1c1f', borderColor: 'rgba(255,255,255,0.06)' }}
                        aria-label={`Editing role: ${selectedRole.name}`}
                        data-testid="role-editor"
                      >
                        {/* Editor header */}
                        <div
                          className="flex shrink-0 flex-col gap-4 rounded-t-xl border-b p-6 sm:flex-row sm:items-center"
                          style={{
                            background: 'rgba(18,18,20,0.5)',
                            borderColor: 'rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="flex w-full flex-1 items-center gap-4">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm"
                              style={{
                                background: '#0a0a0b',
                                borderColor: 'rgba(255,255,255,0.06)',
                              }}
                              aria-hidden="true"
                            >
                              <span
                                className="h-4 w-4 rounded-full"
                                style={{ background: '#10b981' }}
                              />
                            </div>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => handleNameChange(e.target.value)}
                              disabled={selectedRole.isDefault || saveStatus === 'saving'}
                              aria-label="Role Name"
                              className="-ml-2 w-full min-h-[44px] rounded border border-transparent px-2 py-1 text-lg font-semibold text-white transition-all hover:border-white/10 hover:bg-black/30 focus:border-[#10b981] focus:bg-black/30 focus:outline-none"
                              style={{ background: 'transparent' }}
                              data-testid="role-name-input"
                            />
                          </div>
                          {!selectedRole.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDeleteModalOpen(true)}
                              disabled={saveStatus === 'saving'}
                              className="flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-4 text-[13px] font-medium transition-colors hover:bg-red-500/20 disabled:opacity-50"
                              style={{
                                background: '#121214',
                                color: '#ef4444',
                                borderColor: 'rgba(239,68,68,0.5)',
                              }}
                              data-testid="delete-role-btn"
                            >
                              <TrashIcon size={14} /> Delete Role
                            </button>
                          )}
                        </div>

                        {/* Editor body */}
                        <div className="flex flex-1 flex-col overflow-y-auto xl:flex-row">
                          {/* Left: permissions */}
                          <div
                            className="flex-1 border-b p-6 xl:border-b-0 xl:border-r"
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                          >
                            <div className="mb-6">
                              <h3
                                className="mb-1 text-[11px] font-semibold uppercase tracking-wider"
                                style={{ color: 'rgba(255,255,255,0.40)' }}
                              >
                                Server Architecture
                              </h3>
                              <p
                                className="text-xs leading-relaxed"
                                style={{ color: 'rgba(255,255,255,0.60)' }}
                              >
                                Core permissions granted universally across the server space.
                              </p>
                            </div>

                            <div className="mt-6 space-y-2">
                              {PERM_FLAGS.map((pf) => (
                                <PermFlagRow
                                  key={pf.key}
                                  flagKey={pf.key}
                                  label={pf.label}
                                  description={pf.description}
                                  {...(pf.sensitive ? { sensitive: true as const } : {})}
                                  checked={editPerms[pf.key]}
                                  onChange={(v) => handlePermChange(pf.key, v)}
                                  disabled={
                                    selectedRole.isDefault || saveStatus === 'saving' || !isOwner
                                  }
                                  {...(!isOwner
                                    ? {
                                        lockedReason: 'Requires manage_roles permission to modify.',
                                      }
                                    : {})}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Right: channel visibility */}
                          <div className="flex-1 p-6" style={{ background: 'rgba(18,18,20,0.20)' }}>
                            <div className="mb-6">
                              <h3
                                className="mb-1 text-[11px] font-semibold uppercase tracking-wider"
                                style={{ color: 'rgba(255,255,255,0.40)' }}
                              >
                                Channel Visibility
                              </h3>
                              <p
                                className="text-xs leading-relaxed"
                                style={{ color: 'rgba(255,255,255,0.60)' }}
                              >
                                Explicitly define if this role can view specific channels.
                              </p>
                            </div>

                            {overridesLoading ? (
                              <div
                                className="flex items-center justify-center py-8"
                                aria-label="Loading channel overrides"
                                aria-live="polite"
                              >
                                <SpinnerIcon
                                  size={20}
                                  className="animate-spin"
                                  style={{ color: 'rgba(255,255,255,0.40)' }}
                                />
                              </div>
                            ) : (
                              <div
                                className="mt-6 overflow-hidden rounded-lg border"
                                style={{
                                  background: '#121214',
                                  borderColor: 'rgba(255,255,255,0.06)',
                                }}
                                data-testid="channel-visibility-list"
                              >
                                {/* Table header */}
                                <div
                                  className="flex min-h-[44px] items-center justify-between border-b p-3"
                                  style={{
                                    background: 'rgba(10,10,11,0.5)',
                                    borderColor: 'rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <span
                                    className="text-[11px] font-semibold uppercase"
                                    style={{ color: 'rgba(255,255,255,0.40)' }}
                                  >
                                    Channel
                                  </span>
                                  <span
                                    className="mr-1 text-[11px] font-semibold uppercase"
                                    style={{ color: 'rgba(255,255,255,0.40)' }}
                                  >
                                    Can View
                                  </span>
                                </div>

                                {/* Channel rows */}
                                <div
                                  className="divide-y"
                                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                                >
                                  {channels.length === 0 ? (
                                    <p
                                      className="p-4 text-center text-[13px]"
                                      style={{ color: 'rgba(255,255,255,0.40)' }}
                                    >
                                      No channels in this server.
                                    </p>
                                  ) : (
                                    channels.map((ch) => {
                                      const override = overrides.find(
                                        (o) => o.channelId === ch.id && o.roleId === selectedRoleId,
                                      );
                                      const canView = override ? override.canView : null;
                                      return (
                                        <VisibilityToggle
                                          key={ch.id}
                                          channelId={ch.id}
                                          channelName={ch.name}
                                          channelType={ch.type}
                                          isPrivate={ch.isPrivate}
                                          canView={canView}
                                          onChange={(v) => handleVisibilityToggle(ch.id, v)}
                                          disabled={saveStatus === 'saving' || !isOwner}
                                        />
                                      );
                                    })
                                  )}
                                </div>

                                {/* Footer note */}
                                <div
                                  className="flex gap-2 rounded-b border-t p-3"
                                  style={{
                                    background: '#0a0a0b',
                                    borderColor: 'rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <EyeSlashIcon
                                    size={16}
                                    style={{ color: 'rgba(255,255,255,0.40)', marginTop: 2 }}
                                    aria-hidden="true"
                                  />
                                  <p
                                    className="text-[11px] leading-relaxed"
                                    style={{ color: 'rgba(255,255,255,0.40)' }}
                                  >
                                    Channels toggled OFF are completely hidden from users,
                                    overriding standard read permissions.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Editor footer */}
                        <div
                          className="z-20 mt-auto flex min-h-[72px] shrink-0 items-center justify-between rounded-b-xl border-t p-4"
                          style={{
                            background: 'rgba(28,28,31,0.95)',
                            borderColor: 'rgba(255,255,255,0.06)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <output className="text-[13px] font-medium" aria-live="polite">
                            {saveStatus === 'saving' && (
                              <span style={{ color: 'rgba(255,255,255,0.60)' }}>Saving…</span>
                            )}
                            {saveStatus === 'error' && saveError && (
                              <span style={{ color: '#ef4444' }}>{saveError}</span>
                            )}
                          </output>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleDiscard}
                              disabled={!dirty || saveStatus === 'saving'}
                              className="h-10 rounded-md border px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-40"
                              style={{
                                background: '#27272a',
                                borderColor: 'rgba(255,255,255,0.06)',
                              }}
                              data-testid="discard-btn"
                            >
                              Discard
                            </button>
                            <button
                              type="button"
                              onClick={handleSave}
                              disabled={!dirty || saveStatus === 'saving'}
                              aria-busy={saveStatus === 'saving'}
                              className="flex h-10 min-w-[120px] items-center justify-center rounded-md px-6 text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                              style={{ background: '#10b981', color: '#0a0a0b' }}
                              data-testid="save-role-btn"
                            >
                              {saveStatus === 'saving' ? (
                                <>
                                  <SpinnerIcon size={14} className="animate-spin mr-2" />
                                  <span className="sr-only">Saving…</span>
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </button>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>

                  {/* Member assignment section */}
                  <section
                    className="mb-12 rounded-xl border shadow-sm"
                    style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.06)' }}
                    aria-label="Member Role Assignment"
                    data-testid="member-assignment-section"
                  >
                    <div
                      className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <div>
                        <h2 className="text-[15px] font-semibold tracking-tight text-white">
                          Member Assignment
                        </h2>
                        <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          Assign exactly one primary role per member below.
                        </p>
                      </div>
                      <div className="relative w-full md:ml-auto md:w-64">
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          placeholder="Search by name…"
                          aria-label="Search members"
                          className="h-10 w-full rounded-md border pl-9 pr-3 text-[13px] text-white transition-colors hover:border-white/20 focus:border-[#10b981] focus:outline-none"
                          style={{ background: '#0a0a0b', borderColor: 'rgba(255,255,255,0.06)' }}
                          data-testid="member-search-input"
                        />
                        <span
                          className="absolute left-3 top-3 text-[15px]"
                          style={{ color: 'rgba(255,255,255,0.40)' }}
                          aria-hidden="true"
                        >
                          🔍
                        </span>
                      </div>
                    </div>

                    {/* Member list placeholder — GET /servers/:id/members not yet available */}
                    <div className="p-8 text-center">
                      <p
                        className="text-[13px] leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.40)' }}
                      >
                        Member role assignment requires the{' '}
                        <code className="rounded px-1 text-xs" style={{ background: '#1c1c1f' }}>
                          GET /servers/:id/members
                        </code>{' '}
                        endpoint which is not yet available. Use PATCH{' '}
                        <code className="rounded px-1 text-xs" style={{ background: '#1c1c1f' }}>
                          /servers/:id/members/:userId/role
                        </code>{' '}
                        directly when you have a member&apos;s user ID.
                      </p>
                    </div>

                    <div
                      className="border-t p-4 text-center"
                      style={{
                        background: 'rgba(10,10,11,0.20)',
                        borderColor: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        Member list requires API support
                      </span>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
