# V-1 Source-Claim Verification — wave-44 (M8 polish/hardening)

**Reviewer:** karen (V-1 source-claim lane) · **Scope:** load-bearing claims TRUE in merge tree + deployed state. NOT spec-conformance (jenny owns that).
**Merge:** `4522101` (PR #58 squash) · **Deployed:** api `https://api-production-b93e.up.railway.app` · web `https://web-production-bce1a8.up.railway.app` (bundle `index-CX7LuM3C.js`)

## VERDICT: APPROVE

All 6 polish claims + live no-regression + antipattern-disclosure claims verified TRUE in the merge tree and deployed state. 0 Critical, 0 High, 0 Medium. 1 Low observation (non-blocking, cosmetic wording of a historical comment). No claimed-but-fake, no decorative tests, no undocumented deferrals.

---

## Evidence by claim

### Claim 1 — 8e54799a class-scheduling responsive + a11y — CONFIRMED
- `apps/web/src/shell/ClassCalendar.tsx:888-889` — narrow overlay carries `role="dialog"` + `aria-modal="true"` (also documented at `:882`).
- `ClassCalendar.tsx:394-404` — Esc dismiss gated on `!formOpen` (`:395` early-returns while form open, capture-phase listener yielded to SessionForm's own bubble handler). Exactly as claimed.
- `ClassCalendar.tsx:407-427` — focus trap (Tab/Shift+Tab wrap over `overlay.querySelectorAll` focusables, excludes `aria-hidden` subtrees).
- `ClassCalendar.tsx:689` — background `aria-hidden` when narrow overlay open.
- Focus-restore: `formTriggerRef` (`:346`) with `newSessionBtnRef` fallback (`:343`, `:537-539`, `:574-579`).
- CTA "Save": `SessionForm.tsx:630` renders `'Save'`.
- SessionDetail/SessionForm files exist: `apps/web/src/shell/SessionDetail.tsx`, `SessionForm.tsx` (both carry `role="dialog"`+`aria-modal`: SessionForm `:293-294`, SessionDetail `:166-167`).
- **DEPLOYED:** live bundle = `index-CX7LuM3C.js` (matches C-2). Downloaded (1.77 MB) — contains `aria-modal` ×12, `scheduled-sessions` ×5, `New session` ×2, `Save` ×13. Scheduling a11y UI is in the deployed artifact. Cross-checks the T-5 tester's live 1024-overlay verification.

### Claim 2 — 0308cdf1 DTO timestamps — CONFIRMED (additive)
- `packages/shared/src/scheduling.ts:27-28` — `ScheduledSessionSchema` has `createdAt: z.string()` + `updatedAt: z.string()`.
- `apps/api/src/scheduling/scheduling.service.ts` `sessionRowToDto` emits `createdAt: row.created_at.toISOString()` + `updatedAt: row.updated_at.toISOString()`. Additive; all 5 call sites route through `sessionRowToDto`.

### Claim 3 — 683fec9b comment fix + submissions polish — CONFIRMED (with 1 Low note)
- The **actual `can()` call was always `manage_assignments`**: `assignments.service.ts:68` `rbacService.can(userId, serverId, 'manage_assignments')`. Confirmed — no authz behavior change (doc-only, as claimed).
- Active-behavior comments corrected to `manage_assignments`: `assignments.service.ts:39,63`; `assignments.controller.ts:53`; plus `:71,293`.
- **LOW / non-blocking:** `assignments.service.ts:41` still contains the literal string `manage_channels` — but in a factual *historical* note ("wave-23 B-2: swapped **from** manage_channels per plan"). This correctly describes the past migration; it is NOT a stale claim about current behavior. Not a misclaim. Optional: could reword to avoid a future grep false-positive.
- SubmissionsRoster focus-ring 0.4 + username fallback: shipped per commit body (assignment-submissions polish landed).

### Claim 4 — 8828484f MemberListPanel muted-indicator pr-2 — CONFIRMED
- `apps/web/src/shell/MemberListPanel.tsx:498` — right slot `className="flex items-center gap-1 shrink-0 pl-1 pr-2"` (comment `:497` cites DS §3 8px gutter). pr-2 right-gutter present.

### Claim 5 — unit tests exist + ran + passed in CI — CONFIRMED (not decorative)
- Files exist: `apps/api/src/assignments/assignments.submissions.spec.ts` (21 KB) — **16** `it/test` cases. `apps/api/src/scheduling/scheduling.service.spec.ts` (24 KB) — **15** cases. Counts match claim.
- CI run **28695990855** = `success`; `test` job ran `pnpm test:ci` → `turbo run test:ci` → api `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts`. vitest globs `*.spec.ts`, so both specs executed.
- CI headSha `88fb00c` is the pre-squash PR head (a *new* squash commit 4522101 is expected NOT to be a descendant — normal for squash merges). Verified `88fb00c`'s tree **contains both spec files** via `git ls-tree` — the specs that ran in CI are the specs in the merge tree. Not decorative.

### Claim 6 — ca43eb12 delete-any E2E + fixture-B — CONFIRMED
- `apps/web/e2e/delete-any-message.spec.ts` exists (10.6 KB, 1 `test` block — the delete-any journey).
- fixture-B task **c50f3040** status in DB = `done` (`SELECT ... WHERE id LIKE 'c50f3040%'` → `c50f3040-4dfa-4894-9873-7753d30dc8af | done`). Un-stranded (wave_id→NULL at P-0) and resolved as claimed.

### Claim 7 — Live no-regression — CONFIRMED
- api `/health` → **200**.
- Scheduling routes (actual paths — controller is `@Controller()` with `scheduled-sessions` prefixes, NOT `/scheduling/sessions`): `GET /scheduled-sessions/:id` → **401**, `GET /servers/:id/scheduled-sessions` → **401**, `POST /servers/:id/scheduled-sessions` → **401**. Auth guard intact, no regression. (The prompt's `/scheduling/sessions` path 404s because no such route exists — routing is unchanged from prior waves; the guarded routes correctly 401.)
- C-2 confirms api+web both `meta.commitHash = 4522101…` SUCCESS; web bundle changed C8KFLd6n→CX7LuM3C (matches live probe).

### Claim 8 — Antipattern disclosures — CONFIRMED
- **muted-padding live-unverified** disclosed: `T-6-layout.md:3` (layout-verified in code; live-unreachable — no muted member in fixture) + `blocks/V/review-artifacts.md:11` (handed off as info finding).
- **attachment-integration deferred** disclosed across `P-0-frame.md:12,17,22`, `P-0-problem-framer.md:33,50`, `P-1-decompose.md:24`, `P-2-spec.md:7`, `P-3-plan.md:25,34` (deferred-in-task, CI lacks Tigris/S3 creds). Consistently documented, not silently dropped.
- No claimed-but-fake (every asserted file/line present). No decorative tests (specs executed in CI, 31 real cases). No deferred-but-undocumented.

---

## Antipattern sweep result
| Antipattern | Finding |
|---|---|
| Claimed-but-fake | NONE — all cited file:line present in merge tree |
| Decorative tests | NONE — 31 cases ran under `pnpm test:ci`, CI green |
| Deferred-but-undocumented | NONE — both deferrals disclosed in P-0/P-1/P-2/P-3 + T-6/V |
| Deploy false-green | NONE — meta.commitHash pinned 4522101 both services; live bundle matches |

**Findings: 0 Critical · 0 High · 0 Medium · 1 Low (historical-comment wording, non-blocking).**
