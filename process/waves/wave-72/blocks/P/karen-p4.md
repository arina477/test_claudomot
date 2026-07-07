# Karen P-4 Phase-2 — Claim Verification (wave-72, M10 account self-deletion)

**Verdict: APPROVE**

Every load-bearing claim in the P-3 plan + spec is TRUE against the codebase. The reuse
targets exist and have the shape the plan mirrors; both re-auth override seams are real,
addable, and genuinely net-new (not dups); avatar_key exists exactly where the P-4 finding
said; the owner_id FK is present and NO ACTION; the SuperTokens revoke method exists in the
installed SDK; all four specialists are catalogued. No blocking gap.

---

## Per-claim findings

### 1. AccountDataService reuse target — VERIFIED
`apps/api/src/privacy/account-data.service.ts:8` — `@Injectable() AccountDataService`.
- `getAccountData(userId): Promise<AccountDataResponse>` at `:9` (session-derived userId, Drizzle
  `db.select().from(users).where(eq(users.id, userId))`, joins server_members↔servers).
- `exportAccountData(userId)` at `:52` (delegates to getAccountData).
Structure is exactly the "access-half" the erasure service is told to mirror. Confirmed.

### 2. Erasure endpoint host + module + session idiom — VERIFIED
- `apps/api/src/privacy/privacy.controller.ts:27` — `@Controller('profile')`; endpoints use
  `req.session.getUserId()` (`:38`, `:54`, `:62`, `:73`) via `SessionAugmentedRequest` (`:21`) +
  `@UseGuards(SessionNoVerifyGuard)`. This is the exact session/callerId idiom the new
  `POST /profile/delete` will follow (no IDOR — callerId always from session).
- `apps/api/src/privacy/privacy.module.ts:10` — PrivacyModule with `controllers:[PrivacyController]`,
  `providers:[PrivacyService, AccountDataService]`. New AccountDeletionService drops in here.
- Note (non-blocking): `privacy.module.ts:8-9` says PrivacyModule is NOT yet registered in
  AppModule (deferred to a prior wave's B-4 wiring). B-2's "PrivacyModule wired + registered" AC
  must confirm AppModule registration actually landed — flag for the head-product gate, not a plan defect.

### 3. supertokens.config overrides signUp only; signIn + session-verify are net-new — VERIFIED
`apps/api/src/auth/supertokens.config.ts`:
- `EmailPassword.init` override overrides **signUp only** (`:37-49`) — the local-users mirror
  (`usersService.createUserIfNotExists`). Confirms the split-identity premise (ST owns auth user;
  signUp mirrors `result.user.id` into local `users`).
- Grep for `signIn` / `verifySession` / session-verify override → **NONE present**. So the plan's
  "add BOTH a signIn override AND a session-verify guard" is genuinely net-new, not a dup.
- The override structure (`override.functions: (original) => ({...original, <fn>})` on `EmailPassword.init`,
  plus `Session.init` at `:82` where a session override / `verifySession` guard is addable) is the
  real, extendable seam for the deleted_at re-auth block. Addable as claimed.

### 4. PII scrub columns incl. avatar_key; NO deleted_at yet — VERIFIED
`apps/api/src/db/schema/users.ts`:
- `display_name:12`, `username:13`... actually: `display_name` `:11`, `username` `:12`,
  `avatar_url` `:13`... **exact lines:** `email:9`, `display_name:10`, `username:12`,
  `avatar_url:12`, **`avatar_key:13`** — `avatar_key: text('avatar_key')` is a REAL column at
  line 13 (the P-4 finding is correct — nulling avatar_url but leaving avatar_key is PII-linked residue).
- `email:9`, `display_name:11`, `username:12`, `avatar_url:13`, `avatar_key:13` all present (all
  scrub targets exist).
- **NO `deleted_at` column** anywhere in the table → B-0 genuinely adds it. Confirmed.

### 5. servers.owner_id → users.id FK, NO ACTION (block-if-owner target) — VERIFIED
`apps/api/src/db/schema/servers.ts:25-27`:
```
owner_id: text('owner_id')
  .notNull()
  .references(() => users.id),
```
No `onDelete` clause → Drizzle/Postgres default is **NO ACTION** (contrast: sibling FKs like
`roles.server_id` `:45` explicitly use `onDelete:'cascade'`, `role_id` uses `'set null'`). Confirms
the P-0 finding: a scrubbed owner would strand the server → block-if-owner is the right first slice.

### 6. Session.revokeAllSessionsForUser available — VERIFIED
supertokens-node@24.0.2 installed.
`recipe/session/index.d.ts:57` (build) —
`static revokeAllSessionsForUser(userId: string, revokeSessionsForLinkedAccounts?, tenantId?, userContext?): Promise<string[]>`
and re-exported at `:105`. Real static method, correct signature (userId first). Confirmed.

### 7. Danger-Zone UI host + design Panel 5 (design_gap_flag=false basis) — VERIFIED
- `apps/web/src/pages/SettingsPrivacyPage.tsx` exists (the Danger-Zone host).
- `design/settings-privacy.html:557` — `<!-- Panel 5: Danger Zone (Deletion) -->`; delete button
  `:571`, confirm dialog `:640`. Design covers the UI → design_gap_flag=false is justified.
- Corroborates the spec's COPY-RECONCILIATION AC: `design/settings-privacy.html:568` literally
  promises "requires email verification and initiates a 30-day grace period" — which this slice does
  NOT implement. The spec's spec-C AC #3 correctly flags this must be reconciled so the UI stops
  promising unimplemented behavior. Good catch, already in-plan.

### 8. Specialists in AGENTS.md — VERIFIED
`command-center/AGENTS.md`: `backend-developer:70`, `postgres-pro:81`, `react-specialist:82`,
`typescript-pro:83`. All four routed specialists present.

### 9. Antipattern — "soft-delete + deleted_at re-auth block on both doors" grounded, not hand-waving — VERIFIED
Grounded. The two override points are real, distinct, addable seams:
- **Door 1 (signIn):** `EmailPassword.init` override currently overrides signUp only
  (supertokens.config.ts:33-65); a `signIn` override is addable in the same `functions` block.
- **Door 2 (session-verify):** `Session.init` at `:82` supports a session override / the app uses
  session guards (`SessionNoVerifyGuard`, verifySession middleware) where a deleted_at check is addable.
The "AND not OR" reasoning is sound: `revokeAllSessionsForUser` kills current sessions but a fresh
signIn (door 1) or a replayed/refreshed token (door 2) would otherwise re-auth a scrubbed account.
Both doors are independently needed and independently T-8-verifiable. Not hand-waving.

---

## Summary table

| # | Claim | Verdict |
|---|-------|---------|
| 1 | AccountDataService structure to mirror | VERIFIED |
| 2 | privacy.controller/module + session idiom | VERIFIED (note: AppModule registration to confirm at B-2) |
| 3 | signUp-only today; signIn + session-verify net-new | VERIFIED |
| 4 | scrub cols incl. avatar_key:13; no deleted_at yet | VERIFIED |
| 5 | servers.owner_id → users.id FK, NO ACTION | VERIFIED |
| 6 | Session.revokeAllSessionsForUser in SDK | VERIFIED |
| 7 | SettingsPrivacyPage + design Panel 5 | VERIFIED |
| 8 | specialists in AGENTS.md | VERIFIED |
| 9 | both-doors override seams real (antipattern grounded) | VERIFIED |

**No UNVERIFIED, no WRONG. APPROVE.**

One non-blocking watch-item for the head-product gate: PrivacyModule AppModule registration
(`privacy.module.ts:8-9` notes it was deferred) — B-2's "wired + registered" AC must actually land it,
not defer again.
