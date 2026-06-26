# Server Settings — `/servers/:id/settings` route [H1 MVP]

**Purpose:** Enable P2 (Server Organizer / Owner) and delegated admins to manage server structure, roles, permissions, and members. Critical control center for feature 10 (Roles & permissions with owner-lockout safeguard) and feature 11 (Member management — invite, remove, ban). The owner-lockout safeguard is the cornerstone: **never allow configuration that locks the server owner out of their own server.**

---

## Audience

**Primary:** P2 — Server Owner (the P1 who created the server via feature 5) and any member granted an "Admin" or "Moderator" role with server-settings access. Role-gated: only owner or delegated admin roles can view/edit this page.

**Secondary:** P1 members may view read-only server info (e.g., "About" tab) in a lighter panel; editing is owner-only for H1.

**Auth state:** Must be authed. Requires a valid session and membership in the server.

**Role-gating:** Owner can do everything. Admin/Moderator roles can edit members and channels (in H1; in MVP, only owner can edit roles to prevent permission-elevation attacks). Non-admin members get 403 Forbidden if they navigate to `/servers/{id}/settings`.

---

## Entry Points

1. **Server rail context menu:** Right-click on server icon → "Server settings" (only visible to owner/admin). Routes to `/servers/{id}/settings`.
2. **Settings gear icon in server header:** Top-right of the current server view (e.g., in #general channel). Visible only to owner/admin.
3. **Direct URL navigation:** Typed or bookmarked URL `/servers/{id}/settings`.
4. **Deep link from invite:** After creating a server (F7), a "Customize server" link routes to `/servers/{id}/settings` → Channels tab.

---

## Content Sections (Page Anatomy)

Full-page view (not modal). Dark theme. Left sidebar with tabs, main content area with tab content.

### Header

- **Server icon** (48×48px, left).
- **Server name** (editable inline for owner; read-only for admin; centered).
- **Status indicator:** "1 owner, 5 members" or "2 admin, 42 members" (read-only, shows role distribution).
- **Close / Back button** (X or back arrow, top-right) — routes back to server's main channel.

---

### Left Sidebar — Tab Navigation

**Tabs (role-gated):**

1. **Overview** (everyone, read-only) — Server name, icon, description, member count, creation date.
2. **Roles** (owner-only in H1) — Create roles, edit permissions per channel, assign roles to members. **This tab houses the owner-lockout safeguard.**
3. **Members** (owner/admin) — Member list, assign/change roles, remove, ban.
4. **Channels** (owner/admin) — Add, reorder, delete text/voice channels and categories.
5. **Invites** (owner/admin) — Generate/manage invite links with expiry, max-uses, tracking. **Feature 6 management tier.**

**Inactive tabs for non-owner/admin:** Greyed out; hover tooltip "Only server owner can manage this."

---

## Tab 1: Overview (Read-only for all)

**Purpose:** Quick reference; not editable in MVP (H2 may add description/icon edit).

**Content:**
- **Server name:** Large, editable by owner inline (double-click to edit; blur/Enter to save).
- **Server icon:** 64×64px; clickable to upload new icon (owner only; same file validation as feature 5). If not owner, read-only.
- **Description** (if set): 1–2 lines, read-only. Edit button (owner only) → modal to edit description (max 300 chars).
- **Created:** "Created June 26, 2025 at 2:45 PM" (read-only).
- **Member count:** "42 members, 8 online" (read-only).
- **Invite link preview:** Quick copy-to-clipboard button for the default invite link (if one exists; see Invites tab). Label: "Invite link: [abc123xyz] [Copy]".

---

## Tab 2: Roles (Owner-only, H1)

**Mandatory heading (always visible):** "⚠️ Owner-Lockout Safeguard: You cannot remove permissions that lock you out of this server. If a role misconfiguration happens, restore admin to your role or create a new owner-level role."

**Three-section layout:**

### Section 2A: Role List (left panel, 200px)

**Heading:** "Roles"

**Predefined roles (immutable in H1):**
- **@owner** — Cannot be deleted or renamed. Always has all permissions. Only 1 owner per server (assigned at creation).
- **@admin** — Editable; default permissions: can edit server, manage roles (limited), manage members. H2 may make this creatable.
- **@member** — Editable; default permissions: can read all non-private channels, post messages, react, attach files. Default role for new joiners.
- **@guest** — Optional; editable; default permissions: read-only in #general and #announcements. Can be deleted if unused.

**Action buttons:**
- **"+ Add role"** (if <10 roles; H1 limit). Opens form on right panel.
- **Role entry:** Inline, click to select for editing (right panel).

**Color indicator:** Small colored circle next to each role (assignable; helps members identify role visually).

---

### Section 2B: Role Editor (right panel, 400px, wide window; stacks below on narrow)

**When a role is selected (click from 2A):**

**Role header:**
- **Role name** (editable text input, max 50 chars). For @owner, @admin, @member: pre-filled, unlabeled edits not allowed in H1 (show "Pre-defined role" badge). For custom roles: editable.
- **Color picker** (click to choose from preset palette; 12 colors). Inline preview.
- **Delete button** (X icon, red) — only for custom roles, not predefined. Confirmation: "Delete {role}? This cannot be undone. Members with this role will become Members."

**Permissions grid (the core of role management):**

**Channel permission matrix:**
- **Columns:** Text channels (#general, #questions, #assignments, ...) + Voice channels (Study Room, ...) + "Channel management" (column for server-wide permissions).
- **Rows:** Permissions (Read, Post, React, Edit own, Delete own, Manage messages, Invite members, Manage roles, Manage channels, Ban members, etc.).
- **Cell toggle:** Checkbox for each permission. Tri-state: checked (allowed), unchecked (denied), greyed-out (not applicable for this channel type).

**Permission definitions (help text on hover):**
- **Read:** Can see the channel in the list and read messages.
- **Post:** Can send messages.
- **React:** Can add reactions to messages.
- **Edit own:** Can edit their own messages.
- **Delete own:** Can delete their own messages.
- **Manage messages:** Can delete/edit any member's messages (mod power).
- **Invite members:** Can generate invite links.
- **Manage roles:** Can assign roles to members (prevented from creating role-escalation attacks; see safeguard below).
- **Manage channels:** Can add/delete/reorder channels.
- **Ban members:** Can ban members from the server.

**Owner-Lockout Safeguard Logic (MANDATORY):**

- **At save time:** Before persisting any role change, validate that the owner's role still has `Manage roles` + `Manage channels` + `Read + Post` in at least one channel (e.g., #general).
- **If validation fails:** Show inline error toast: "Permission denied: You cannot remove permissions from your (owner) role without breaking your access to the server. Restore the permission or create a new owner-level role first."
- **Never persist the broken configuration.** This is a hard-stop: no "rollback" UI needed because the save never completes.
- **UI hint:** Highlight owner's role row with a light gold background to signal "protected." On hover over owner row, show tooltip "This is your role; you cannot lock yourself out."
- **If custom role would elevate a non-owner member to match owner (all perms):** Show warning toast "Warning: This role now has owner-level permissions. Only assign to trusted members." (allow, but warn).

**Save / Cancel buttons** (bottom right, fixed position on wide; sticky on narrow):
- **"Save"** (primary) — Validates safeguard; POST `/api/servers/{id}/roles/{role_id}` with updated permissions. On success, show toast "Role permissions updated." On error (safeguard violation), show inline error and prevent save.
- **"Cancel"** (secondary) — Discard unsaved edits; select returns to unmodified state.

---

### Section 2C: Assign Roles to Members (bottom, full width)

**Heading:** "Quick assign" or "Bulk role assignment"

**Layout:** Member list (simplified; name, current role, role dropdown). Drag-select multiple members, pick a new role, "Apply" button.

**Interactions:**
- Click member row to select (highlight). Ctrl+click for multi-select.
- Dropdown (per member or bulk): Shows available roles (not owner; can select admin, member, guest, custom roles).
- "Apply" button (enabled if ≥1 member selected): PATCH `/api/servers/{id}/members/{user_id}` for each. On success, show toast "Roles updated."

**Safeguard:** Cannot unassign the owner role (it's immutable at creation). If user is the owner, show badge "Owner" instead of dropdown.

---

## Tab 3: Members (Owner/Admin)

**Heading:** "Members ({count})"

**Member list (table or card layout):**

**Columns:**
- **Member name** (clickable → member detail panel).
- **Role** (dropdown for owner/admin to change; locked for non-admins). Shows current role; click to open dropdown.
- **Joined date** (e.g., "June 20, 2025").
- **Status** (Online / Offline / Last seen X hours ago).
- **Actions** (remove, ban, or more menu).

**Actions column (owner/admin only):**
- **Remove** (icon: person-minus) → toast "Remove {member} from server?" / "Remove" "Cancel". Soft-deletes membership; member can rejoin via invite.
- **Ban** (icon: prohibition) → toast "Ban {member}? They cannot rejoin without manual unbanning." / "Ban" "Cancel". Hard-delete + add to ban list.
- **More menu** (•••) → "Promote to admin" (if not admin), "Demote to member" (if admin), "View profile", "Message" (H2 feature: DMs), "Ban".

**Safeguard (owner removal):** Cannot remove the owner (you). If you click "Remove" on yourself, toast: "You cannot remove yourself as the owner. Promote another member to owner first, then transfer ownership."

**Search / filter:**
- **Search input:** Filter members by name or email.
- **Role filter dropdown:** Show "All", "Owner", "Admin", "Member", "Guest". Refine the member list.
- **Status filter:** "Online", "Offline", "All".

**Empty state:** "No members yet. Generate an invite link to add people."

---

## Tab 4: Channels (Owner/Admin)

**Two-panel layout (like Roles): left = channel list, right = editor.**

### Section 4A: Channel List (left, 240px)

**Heading:** "Channels"

**Structure:**
- **Categories** (collapsible, like feature 5 step 3).
  - Category name (editable inline).
  - Channels under each category (drag-reorder across categories).
  - Voice channels grouped at the bottom or in a "Voice" category.
- **Uncategorized channels** (at the top if any).

**Actions per category:**
- **Add channel** (button per category: "+ Add").
- **Delete category** (X icon; tooltip "Delete category?"). Confirmation: "Delete {category}? Channels in it will move to uncategorized." Channels are not deleted, only uncategorized.
- **Rename category** (double-click to edit inline; Enter/blur to save).

**Actions per channel:**
- **Reorder** (drag handle; visual feedback).
- **Edit** (click channel name or pencil icon) → right panel (2C).
- **Delete** (X icon; confirmation).

**"+ Add channel"** button (bottom, adds to uncategorized or open category).

---

### Section 4B: Channel Editor (right, 400px, stacks on narrow)

**When a channel is selected or "Add channel" clicked:**

**Channel settings form:**
- **Channel type:** Radio buttons "Text channel" / "Voice channel" (immutable after creation, but deletable + recreatable).
- **Channel name** (required, max 80 chars). Live validation: lowercase + no spaces (converted to kebab-case, e.g., "Study Group" → "study-group").
- **Description** (optional, max 200 chars, text channels only). Shown in channel sidebar hover.
- **Category** (dropdown): Assign to a category or "Uncategorized".
- **Private** (toggle, future feature; disabled in H1): Make read-only (not in MVP; H2 may add private channels). Greyed out with label "Coming soon".
- **Delete** (red button, bottom-left): Confirmation "Delete #channel? This cannot be undone. Messages are archived but hidden from view." (Soft-delete; messages persisted for compliance; H2 may add hard-delete for admins).

**Save / Cancel buttons** (bottom-right).

**Empty state (section 4B initially):** "Select a channel to edit or create a new one."

---

## Tab 5: Invites (Owner/Admin)

**Purpose:** Manage invite links. Implements the P2-facing tier of feature 6.

**Invite list (table):**

**Columns:**
- **Invite code** (e.g., "abc123xyz456") — clickable to copy.
- **Created by** (username of P2 who generated it).
- **Created date** (e.g., "June 25, 2025 at 3:00 PM").
- **Expires** (e.g., "June 26, 2025" or "Never"). Editable (click to change expiry).
- **Max uses** (e.g., "10" or "Unlimited") — Editable.
- **Uses** (e.g., "3 / 10" or "7 / Unlimited") — Read-only.
- **Status** (Active / Expired / Max-uses-reached) — Read-only.
- **Actions:** Revoke (X), Copy link, Edit (expiry/max-uses).

**Generate new invite button ("+ New invite"):**
- Form modal: Name (optional, e.g., "Week 2 cohort"), Expiry (Never / 1 day / 7 days / custom), Max uses (Unlimited / custom #). 
- "Generate" button → POST `/api/servers/{id}/invites`. On success, add to list; show toast "Invite link generated: abc123xyz456 [Copy]".

**Empty state:** "No active invites. Generate one to invite members."

**Bulk actions (H2):** Revoke multiple, export invite list (CSV).

---

## Interactions (Elements → Side-Effects)

| Element | Interaction | Side-effect |
|---------|-------------|------------|
| Tab selection (left sidebar) | Click | Navigate to tab's content section. Route to `/servers/{id}/settings?tab={tab_name}`. Preserve scroll position per tab (sessionStorage). |
| Server name (Overview) | Double-click | Enable inline edit; focus input. On blur or Enter: PATCH `/api/servers/{id}` with { name }. On success, update header + toast "Server name updated." On error (name > 80 chars, network): show inline error. |
| Server icon upload (Overview) | Click | File picker. Validate type (JPEG/PNG), size (<2MB). On select, POST `/api/servers/{id}/upload-icon`. On success, update icon display + toast "Icon updated." On error: show inline error. |
| Edit description (Overview) | Click "Edit" | Modal with textarea (max 300 chars). Save → PATCH. |
| Role name edit (Roles, predefined) | Double-click | Locked; show badge "Pre-defined — cannot rename in MVP." or allow rename for custom roles. |
| Color picker (Roles) | Click | Color palette dropdown. Select → update swatch; persist on Save. |
| Permission toggle (Roles, matrix cell) | Click | Toggle checkbox. Mark form as dirty (show unsaved indicator). No immediate save; Save button required. |
| Add role (Roles) | Click "+ Add role" | Create empty role form on right panel. Name input focused. Counter shows "X / 10 roles" (H1 limit). On Save, POST `/api/servers/{id}/roles` with { name, color, permissions: {...} }. On success, add to role list + toast "Role created." |
| Delete role (Roles, custom) | Click X | Confirmation toast "Delete {role}? Members will become Members." / "Delete" "Cancel". On confirm, DELETE `/api/servers/{id}/roles/{role_id}`. On success, remove from list + toast "Role deleted." |
| Save role permissions (Roles) | Click "Save" | **OWNER-LOCKOUT VALIDATION GATE:** Before POST, validate that the owner's role retains `Manage roles` + `Manage channels` + ability to read ≥1 channel. If validation fails, show inline error toast (see Safeguard in Tab 2 description). If pass, PATCH `/api/servers/{id}/roles/{role_id}` with updated permissions. On success, toast "Role permissions updated." On error (safeguard violation), prevent save. |
| Change member role (Members, dropdown) | Select new role | PATCH `/api/servers/{id}/members/{user_id}` with { role_id }. On success, update row + toast "{member} is now {role}." On error: show inline error. |
| Remove member (Members) | Click remove icon | Confirmation toast "Remove {member} from server?" / "Remove" "Cancel". On confirm, DELETE `/api/servers/{id}/members/{user_id}`. On success, remove row + toast "{member} removed." On error: show inline error. Safeguard: cannot remove owner (self). |
| Ban member (Members) | Click ban icon | Confirmation toast "Ban {member}? They cannot rejoin." / "Ban" "Cancel". On confirm, PATCH `/api/servers/{id}/bans` with { user_id }. On success, remove row + add to ban list + toast "{member} banned." |
| Reorder channel (Channels, drag) | Drag channel | Visual feedback (highlight, drop indicator). On drop, reindex. Persist reorder on Save (see below). |
| Add channel (Channels) | Click "+ Add channel" | Form on right panel; type selector (Text/Voice). Name input focused. On Save, POST `/api/servers/{id}/channels` with { name, type, description, category_id, display_order }. On success, add to list + toast "Channel created." |
| Edit channel (Channels) | Click channel | Show form on right panel. Editable fields: name, description, category. On Save, PATCH `/api/servers/{id}/channels/{channel_id}`. On success, toast "Channel updated." |
| Delete channel (Channels) | Click X | Confirmation toast "Delete #channel? This cannot be undone." / "Delete" "Cancel". On confirm, DELETE `/api/servers/{id}/channels/{channel_id}` (soft-delete; messages archived). On success, remove from list + toast "Channel deleted." |
| Generate invite (Invites) | Click "+ New invite" | Modal form: Name, Expiry, Max uses. On Submit, POST `/api/servers/{id}/invites` with { name?, expires_at?, max_uses? }. Response: { code, created_at, expires_at, max_uses, uses: 0 }. Add to list + toast "Invite generated: {code} [Copy]". |
| Copy invite link (Invites) | Click code or copy icon | Copy to clipboard: `https://studyhall.app/invite/{code}`. Toast: "Invite link copied!" |
| Revoke invite (Invites) | Click X / revoke | Confirmation "Revoke invite {code}?" / "Revoke" "Cancel". On confirm, PATCH `/api/servers/{id}/invites/{code}` with { revoked: true } or DELETE. On success, mark as revoked or remove from list + toast "Invite revoked." |

---

## Data Requirements

**Endpoints:**

- **GET `/api/servers/{id}/roles`** — Fetch all roles and their permissions.
  - Response: `{ roles: [{id, name, color, is_predefined, permissions: {channel_id: [Read, Post, ...]}}, ...] }`
  - Auth: Owner/Admin.

- **POST `/api/servers/{id}/roles`** — Create custom role.
  - Request: `{ name, color, permissions: {...} }`
  - Response: `{ id, name, color, is_predefined: false, permissions: {...} }`
  - Auth: Owner.

- **PATCH `/api/servers/{id}/roles/{role_id}`** — Update role permissions.
  - Request: `{ permissions: {...} }`
  - **Validation:** OWNER-LOCKOUT SAFEGUARD gate runs here (server-side).
  - Response: `{ id, name, permissions: {...} }`
  - Auth: Owner.
  - Error codes: 400 (safeguard violation), 403 (not owner), 404 (role not found).

- **DELETE `/api/servers/{id}/roles/{role_id}`** — Delete custom role (predefined roles cannot be deleted).
  - Request: None.
  - Response: `{ deleted: true }`
  - Auth: Owner.
  - Side-effect: Members with this role are reassigned to @member.

- **GET `/api/servers/{id}/members`** — Fetch members list.
  - Query params: `?role={role_id}`, `?status=online|offline`, `?search={query}`.
  - Response: `{ members: [{user_id, username, email, role_id, joined_at, status, last_seen}, ...] }`
  - Auth: Owner/Admin.

- **PATCH `/api/servers/{id}/members/{user_id}`** — Update member role.
  - Request: `{ role_id }`
  - Response: `{ user_id, role_id }`
  - Auth: Owner/Admin.
  - Safeguard: Cannot unassign owner role.

- **DELETE `/api/servers/{id}/members/{user_id}`** — Remove member (soft-delete).
  - Request: None.
  - Response: `{ deleted: true }`
  - Auth: Owner/Admin.
  - Safeguard: Cannot remove owner (self).

- **PATCH `/api/servers/{id}/bans`** — Ban member (hard-delete + add to ban list).
  - Request: `{ user_id }`
  - Response: `{ banned: true, user_id }`
  - Auth: Owner/Admin.

- **GET `/api/servers/{id}/channels`** — Fetch channels and categories.
  - Response: `{ categories: [{id, name, display_order}], channels: [{id, name, type, description, category_id, display_order}, ...] }`
  - Auth: Owner/Admin.

- **POST `/api/servers/{id}/channels`** — Create channel.
  - Request: `{ name, type: 'text'|'voice', description?, category_id?, display_order }`
  - Response: `{ id, name, type, description, category_id, display_order }`
  - Auth: Owner/Admin.

- **PATCH `/api/servers/{id}/channels/{channel_id}`** — Update channel (name, description, category, display_order).
  - Request: `{ name?, description?, category_id?, display_order? }`
  - Response: `{ id, name, description, category_id, display_order }`
  - Auth: Owner/Admin.

- **DELETE `/api/servers/{id}/channels/{channel_id}`** — Soft-delete channel.
  - Request: None.
  - Response: `{ deleted: true }`
  - Auth: Owner/Admin.

- **GET `/api/servers/{id}/invites`** — Fetch active invite links.
  - Response: `{ invites: [{code, created_by, created_at, expires_at, max_uses, uses, status: 'active'|'expired'|'max-reached'}, ...] }`
  - Auth: Owner/Admin.

- **POST `/api/servers/{id}/invites`** — Generate new invite link.
  - Request: `{ name?, expires_at?, max_uses? }`
  - Response: `{ code, created_by, created_at, expires_at, max_uses, uses: 0 }`
  - Auth: Owner/Admin.

- **PATCH `/api/servers/{id}/invites/{code}`** — Update invite expiry / max-uses or revoke.
  - Request: `{ expires_at?, max_uses?, revoked?: boolean }`
  - Response: `{ code, expires_at, max_uses, revoked? }`
  - Auth: Owner/Admin.

**Local state during flow:**
- Active tab (sessionStorage or URL param).
- Role edit draft (component state; not persisted until Save).
- Channel reorder draft (component state; persisted on Save).
- Scroll position per tab (sessionStorage).

**Offline behavior:**
- All form inputs remain editable while offline.
- "Save" buttons disabled; tooltip "Connect to save changes."
- On reconnect, user must re-click "Save" to flush changes (not auto-retry).

---

## Empty/Error/Loading States

**Loading (page load, fetching roles/members/channels):**
- Skeleton loaders for each tab's content (shimmer animation).
- Spinner in center of main content area.
- Subtext: "Loading server settings..." (removed once loaded).

**Error — No permission:**
- Heading: "Access denied"
- Body: "You don't have permission to manage this server. Only the owner or an admin can access these settings."
- CTA: "Go back" (navigate to server).

**Error — Server not found:**
- Heading: "Server not found"
- Body: "This server no longer exists or you've lost access."
- CTA: "Go home" (navigate to `/app`).

**Error — Safeguard violation (owner-lockout):**
- Inline toast below "Save" button: "Permission denied: You cannot remove permissions from your (owner) role without breaking your access to the server. Restore the permission or create a new owner-level role first."
- Form remains open; changes are NOT persisted.
- "Save" button shows error state (red background, disabled briefly, then re-enabled for retry).

**Error — Network failure (save operation):**
- Inline toast: "Failed to save changes. Check your connection and try again."
- Form remains open; unsaved indicator shows.
- "Save" button available for retry.

**Offline (all tabs):**
- Connection-state indicator shows "Offline".
- "Save" buttons disabled; tooltip "Connect to save changes."
- If editing and user navigates away: unsaved-changes prompt (standard browser "Leave page?" dialog).

**Empty state — No members:**
- Members tab: "No members yet. Generate an invite link in the Invites tab to add people."

**Empty state — No channels:**
- Channels tab: "No channels yet. Add your first channel to get started."

**Empty state — No invites:**
- Invites tab: "No active invites. Generate one to start inviting members."

---

## Responsive Breakpoints

**Desktop wide (>1200px):**
- Left sidebar (240px fixed, sticky on scroll).
- Main content area (flexible, 600–900px).
- Two-panel editor (left + right side-by-side).
- Member list: table layout (4–5 columns).
- Channel list: full hierarchy (categories + channels, drag-reorder smooth).

**Desktop narrow / tablet (800–1200px):**
- Left sidebar (200px fixed) or collapsible hamburger.
- Main content area (flex).
- Two-panel editor: stack vertically (left list, right editor below).
- Member list: card layout (1 per row).
- Channel list: simplified (drag-reorder may use drag handle instead of full-width).

**Phone (<800px):**
- Full-screen; left sidebar hidden behind hamburger menu.
- Main content area (full width, padding 20px).
- Tab navigation: horizontal scroll or dropdown.
- Two-panel editor: full-stack, single column.
- Member list: card layout, name + role only.
- Channel list: simplified, no drag-reorder (too complex on small screen; H2 may add).
- **Note:** Out of scope for MVP (mobile app not planned), but responsive CSS prepared for H2.

---

## Success Metrics

**North-star indicators:**
- **Server customization rate:** % of created servers that have ≥1 custom role or channel added (feature 10, 11 adoption; early P2 engagement).
- **Member management activity:** % of servers with >5 members and an owner/admin who has visited the Members tab (indicates active moderation / governance).
- **Invite generation rate:** % of servers that generate ≥1 invite link (feature 6 downstream of invite-join; measures P2 cohort-distribution velocity).
- **Owner-lockout safeguard trigger rate:** # of times the safeguard blocks a save (should be low; signals user confusion or edge-case role config). Target: <1% of role saves.

**Secondary:**
- **Role creation rate:** % of servers with custom roles (vs using defaults only). Indicates power-user adoption.
- **Channel count per server:** Average channels per server (adoption of server-organization pattern).
- **Page load latency:** Time to fetch and render roles/members/channels (performance indicator for large servers).

**Instrumentation:**
- Track event `settings.tab_opened(tab_name)`.
- Track event `settings.role_created(role_name, permission_count)`.
- Track event `settings.role_updated(role_id, permission_changes)`.
- Track event `settings.role_save_blocked(reason: 'owner-lockout-safeguard')` (every safeguard block should log).
- Track event `settings.member_removed(removed_user_id)`.
- Track event `settings.member_banned(banned_user_id)`.
- Track event `settings.channel_created(channel_type)`.
- Track event `settings.channel_deleted(channel_id)`.
- Track event `settings.invite_generated(expires_at, max_uses)`.
- Track page load time and API latency per endpoint.

---

## Competitor Comparison

**vs Discord (Tier-1 benchmark):**

- **Discord parity:** Discord's server settings offer role management (up to 250 roles), member management, channel CRUD, invite tracking. The UX is similar (left sidebar, tabbed interface).
- **StudyHall advantage:** Owner-lockout safeguard is an explicit, enforced pattern (feature 10, safeguard requirement). Discord has role hierarchies but does not explicitly prevent owner self-lockout (it's a common mishap in Discord communities). StudyHall validates at save time; Discord lets the admin break their own server.
- **StudyHall disadvantage (H1):** Discord supports role templates (e.g., "Gaming", "Streaming"), advanced permission scoping (per-category overrides), and bot role integration. StudyHall MVP is simpler (flat role structure, basic channel-level permissions). H2 can add complexity.
- **Discord strength:** Invite tracking is richer (shows invite source, join method, suspension status per invite). StudyHall MVP is minimal (code, uses, expiry).

**vs Microsoft Teams (Tier-1 benchmark, academic dimension):**

- **Teams model:** Roles are locked to institutional structure: "Educator", "Student", "Guest" with pre-configured permissions. Channel-level RBAC is limited (private channels are educator-only, team-wide defaults). No invite links; Azure AD drives membership.
- **StudyHall advantage:** Student-created roles (P2 can define custom roles like "Study lead", "TA", "Tutor"). Invite links enable peer-driven cohort formation. No institutional gatekeeping. Owner-lockout safeguard is explicit (Teams doesn't need it because admin is institutionally appointed; StudyHall must protect peer admins from themselves).
- **StudyHall weakness (H1):** No hierarchy (Discord and Teams both support role precedence; StudyHall MVP treats roles as flat). No permission inheritance (Teams has team-default + channel-override; StudyHall MVP is per-channel). H2 can add.
- **Conclusion:** StudyHall's student-self-provisioning model requires explicit safeguards (owner-lockout) that institutional platforms don't prioritize. This is a StudyHall-specific design burden.

**Offline differentiation:** If user is offline, form inputs remain editable (draft mode). On reconnect, user must manually save (not auto-sync). No offline-queue for settings changes in MVP (feature 12 is messaging-scoped; settings changes are rare and require immediate confirmation).

---

## Notes

- **Owner-lockout safeguard (CRITICAL):** Server-side validation MUST run on every PATCH `/api/servers/{id}/roles/{role_id}` request. Algorithm:
  1. Fetch current user's role and permissions.
  2. After proposed update, check: does the user's role retain `Manage roles` (or is owner?) AND can they read ≥1 text channel?
  3. If no, reject with 400 (Bad Request) + body `{ error: "owner_lockout_safeguard", message: "Configuration would lock you out." }`.
  4. Never persist broken config.
  5. Client-side validation is a UX helper (show warning before Save); server-side validation is the hard gate.

- **Predefined roles (immutable in H1):**
  - @owner: 1 per server, cannot be deleted, cannot change name.
  - @admin: Optional; serves as "trusted helper" tier. H2 may make this a template (creatable, not predefined).
  - @member: Default role for new joiners; can be renamed but not deleted.
  - @guest: Optional; read-only role. Can be deleted if unused.

- **Permission matrix scope (H1 MVP):** Basic per-channel RBAC only. Per-message / per-thread permissions are H2+. Category-level permission inheritance is H2+ (MVP requires explicit per-channel config).

- **Ban list management:** Banned members appear in a separate "Banned members" section of the Members tab (H2; MVP may omit). Unbanning is owner-only. Banned users see "You're banned from this server" on join attempt.

- **Member list sync:** If another admin is editing members concurrently, poll every 10 seconds or use WebSocket to keep member list fresh. Show "Updated just now" indicator on list refresh.

- **Invite link expiry defaults:** Never (recommended for study groups, keeps invite usable), 1 day (high-security), 7 days (common), custom. Default is "Never" for UX simplicity.

- **Channel reorder persistence:** Display order is stored in the `display_order` column (integer, sortable). Drag-reorder updates this field. Channels are fetched sorted by `display_order`.

---
**Approved design (v9):** `design/server-settings.html`
