# B-6 Refix Re-verification — wave-68 (M11 publish-write-half)

Branch: `wave-68-publish-directory` · Fix-up commit: `dc34e41`
Scope: confirm the /review findings on the B-6 Phase-1-APPROVED work are closed
without regression. Security gate was already CONFIRMED correct; must stay untouched.

## Verdict: REWORK

Five of six /review findings are closed at source, the security gate is untouched,
and tests are green — but **finding 2 (post-save reconcile — the one /review flagged
as "the important one") is NOT closed at the call site.** The plumbing was built but
never connected, so the production stale-revert bug the review called out still ships.
The green suite does not catch it, which is itself a gate concern.

## Finding-by-finding

| # | Finding | Status | Evidence |
|---|---------|--------|----------|
| 1 | Whole editable surface owner-gated | CLOSED | `ServerOverviewSettings.tsx`: description/topic `disabled={!isOwner}` + `aria-readonly`; Save/Discard block wrapped in `{isOwner && (…)}`; `canSave` now `isOwner && dirty && …`. Publish card stays `{isOwner && …}`. No editable-then-403 path for non-owners. |
| 2 | **Post-save reconcile** | **NOT CLOSED** | Plumbing exists — `ServerContext` exposes `refetchDetail()` (detailFetchKey counter re-runs GET /servers/:id, effect dep `[selectedId, detailFetchKey]`), component gained `onSaveSuccess?` and calls `onSaveSuccess?.()` on save success, baseline state updates. **But the sole caller `ChannelSidebar.tsx` (line 338-351) never passes `onSaveSuccess`, and does not destructure `refetchDetail` from `useServers()` (line 162-173).** So `onSaveSuccess?.()` is a no-op in production; `selectedDetail` is never refreshed; on reopen `initialDescription`/`initialTopic`/`initialIsPublic` still read the stale `selectedDetail` → panel reverts to pre-save values. This is exactly the stale-`selectedDetail` clobber the review flagged. |
| 3 | isOwner loading/error (no silent lockout) | CLOSED | `OwnerStatus = 'loading'\|'owner'\|'non-owner'\|'error'` replaces `null===non-owner`; getMe `.catch` → `'error'` → red banner (`data-testid="getme-error"`, "Could not verify your identity. Please reload to retry."), not a silent read-only lockout. Loading renders neutral `…` avoid­ing an owner "ME" flash. |
| 4 | 403 via HttpError.status | CLOSED | Error branch: `err instanceof HttpError ? err.status === 403 : err instanceof Error && err.message.includes('403')`. Status-first with message fallback. |
| 5 | Partial patch (only-changed fields) | CLOSED | `handleSave` diffs each field vs `baseline*`; only changed fields enter `patch`; `Object.keys(patch).length === 0` → no-op early-return. No whitespace-clobber on toggle-only save. |
| 6 | Private-exclusion integration assertion | CLOSED | `update-server-member-count.spec.ts`: `PRIVATE-EXCLUSION` test seeds `is_public=false` server with 2 members (so a broken filter floats it to the top under memberCount DESC), asserts its id is absent from `discoverServers` and the three public servers remain. Load-bearing. |

## No-regression checks

- **Security gate UNTOUCHED (confirmed):** `updateServer` (servers.service.ts:451) still gates
  `server.owner_id !== userId → ForbiddenException` before the update, ordered 404→403→update.
  The only servers.service.ts change in `dc34e41` is `GROUP BY servers.id` inside the *different*
  `discoverServers` method. Gate not weakened.
- **GROUP BY servers.id:** valid PK functional-dependency reduction; `memberCount` is `COUNT()`
  over the LEFT JOIN, unaffected. Correct.
- **web 602/602 green** (ran locally, confirmed) · **web typecheck clean** (`tsc --noEmit` passed).
  Note: green is not exonerating here — the component test (`server-overview-settings.test.tsx`,
  "calls onSaveSuccess after a successful save") passes the callback in via `renderPage({ onSaveSuccess })`,
  so it verifies the component *would* reconcile if wired, never that the real caller wires it.
  `onSaveSuccess?` being optional is also why `tsc` doesn't catch the dangling wire. Contract drift
  at the component seam, invisible to both suites.
- **api 764/764:** not re-run locally; the live-DB integration spec is `describe.skipIf(SKIP)` on
  `DATABASE_URL_TEST` (skips locally). **AC9 CI carry reaffirmed:** this wave's live-DB integration
  tests (incl. the new PRIVATE-EXCLUSION assertion) MUST run green in CI where `DATABASE_URL_TEST`
  is set — a C-block obligation; a local skip is not a pass.

## Required rework (single, small)

Wire the reconcile at the call site in `apps/web/src/shell/ChannelSidebar.tsx`:
1. add `refetchDetail` to the `useServers()` destructure (line ~162-173);
2. pass `onSaveSuccess={refetchDetail}` on the `<ServerOverviewSettings …>` element (line ~338-351).

Then add a test that actually exercises the seam — either a ChannelSidebar-level test asserting the
prop is wired to context, or promote the reconcile assertion to render through ChannelSidebar — so a
future dangling wire fails the suite rather than passing it.

---

```yaml
head_signoff:
  verdict: REWORK
  stage: B-6-refix-verify
  reviewers: { self: head-builder-reverify }
  failed_checks:
    - "finding-2 post-save reconcile: refetchDetail exposed + onSaveSuccess fired, but ChannelSidebar (sole caller) never passes onSaveSuccess/refetchDetail — production stale-revert unfixed; onSaveSuccess?.() is a no-op"
    - "test seam: component test injects onSaveSuccess itself, so green suite does not cover the missing call-site wire (contract drift invisible to tests + typecheck)"
  passed_checks:
    - "finding-1 whole editable surface owner-gated (fields disabled + Save/Discard isOwner-wrapped)"
    - "finding-3 OwnerStatus loading/error, no silent owner lockout"
    - "finding-4 403 via HttpError.status with message fallback"
    - "finding-5 partial patch of changed-only fields, no-op when unchanged"
    - "finding-6 private-exclusion live-DB integration assertion present + load-bearing"
    - "security gate updateServer owner_id!==userId → 403 before update UNTOUCHED by fix-up"
    - "GROUP BY servers.id PK-reduction correct; memberCount unaffected"
    - "web 602/602 + web typecheck clean"
  rationale: >
    The fix-up closes 5 of 6 findings at source and leaves the owner-authz security gate
    untouched, but the highest-value finding (post-save reconcile) is only half-landed: the
    context method (refetchDetail) and the component callback (onSaveSuccess) both exist, yet
    the sole caller ChannelSidebar wires neither, so onSaveSuccess?.() no-ops and selectedDetail
    is never refreshed — the exact stale-revert /review flagged still ships. The green web suite
    and clean typecheck do not catch it because the component test injects the callback itself and
    the prop is optional. This is contract drift at the component seam. Rework is a two-line wire
    at the call site plus a seam-level test; not an ESCALATE.
  next_action: REWORK_B-6
```

---

## B-6 Refix Re-verification — Attempt 2 (final)

**Commit under review:** `9af167d` — "fix: B-6 rework — wire onSaveSuccess=refetchDetail at ChannelSidebar seam (wave-68)"
**Branch:** `wave-68-publish-directory`
**Predicate:** Attempt-1 REWORK left `finding-2` half-landed — post-save reconcile plumbing built (`ServerContext.refetchDetail` + `ServerOverviewSettings.onSaveSuccess`) but never connected at the sole caller (`ChannelSidebar`), so `onSaveSuccess?.()` no-oped and `selectedDetail` stale-revert still shipped. This attempt re-checks the seam only, plus no-regression.

### 1. Seam wired — PASS
- **Destructure:** `apps/web/src/shell/ChannelSidebar.tsx:173` — `refetchDetail` is now destructured from `useServers()`.
- **Mount site:** `apps/web/src/shell/ChannelSidebar.tsx:352` — `<ServerOverviewSettings ... onSaveSuccess={refetchDetail} />`.
- Both ends confirmed. `ServerOverviewSettings.tsx:272` invokes `onSaveSuccess?.()` inside the `try` block after `await api.updateServer` (line 257) succeeds and before the `catch` — success-path only, never on 403/error.

### 2. Seam test — PASS
- New `describe('ChannelSidebar — ServerOverviewSettings onSaveSuccess seam')` in `shell-components.test.tsx` renders the real `<ChannelSidebar />` (not the component in isolation), injects a `refetchDetail` spy via the real `ServerContext.Provider`, opens Overview via the real gear button (`server-settings-btn` → `setOverviewPageOpen(true)`), makes the form dirty (`description-input`), clicks the real `save-btn`, and asserts `refetchDetail` was `toHaveBeenCalledOnce()`.
- The assertion is load-bearing through ChannelSidebar's own wiring: the spy is the context value, NOT an injected `onSaveSuccess` prop. If the `onSaveSuccess={refetchDetail}` wire is ever removed, the callback is never reached and the test FAILS. This closes the exact blind spot of the attempt-1 component test (which injected `onSaveSuccess` itself and could not see the dangling caller wire).

### 3. No regression — PASS
- Prior findings intact: finding-1 (whole editable surface owner-gated), finding-3 (OwnerStatus loading/error), finding-4 (403 via `HttpError.status` + message fallback), finding-5 (partial patch changed-only), finding-6 (private-exclusion live-DB integration assertion), GROUP BY servers.id PK-reduction.
- **Security gate UNTOUCHED:** commit `9af167d` stat contains only `ChannelSidebar.tsx` + `shell-components.test.tsx`. `servers.service.ts` / `servers.controller.ts` were not modified. `updateServer` retains `@UseGuards(AuthGuard)` on `PATCH :id` plus service-layer `owner_id !== userId → ForbiddenException` before any write — server-side-at-the-door.
- **web 603/603** (39 files) ✓ · **api 764/764** (40 files) ✓ · **`pnpm -r typecheck` clean** (shared/web/api) ✓ · **web build clean** (PWA generateSW, dist emitted) ✓.

### C-block AC9 carry (reaffirmed)
The live-DB integration tests — including the private-exclusion assertion (finding-6) — skip locally when `DATABASE_URL_TEST` is unset and MUST run GREEN in CI against real Postgres. This is a carried acceptance criterion the C-block owns at C-1 (CI) / C-2 (deploy verify); a green local suite does NOT discharge it. head-ci-cd must confirm the integration job runs and passes in CI before merge.

```yaml
head_signoff:
  verdict: APPROVED
  stage: B-6-refix-verify (attempt 2, final)
  reviewers: { self: head-builder-reverify }
  failed_checks: []
  passed_checks:
    - "seam wired: refetchDetail destructured from useServers() (ChannelSidebar.tsx:173) + onSaveSuccess={refetchDetail} at mount (ChannelSidebar.tsx:352)"
    - "onSaveSuccess?.() on success path only (ServerOverviewSettings.tsx:272, inside try, after await updateServer, before catch)"
    - "seam test renders real ChannelSidebar, opens Overview via real gear btn, saves, asserts injected refetchDetail spy fires — dangling wire now FAILS the suite"
    - "finding-1 owner-gated editable surface UNTOUCHED"
    - "finding-3 OwnerStatus, finding-4 403 status-first, finding-5 partial patch, finding-6 private-exclusion integration, GROUP BY — all UNTOUCHED"
    - "owner-authz security gate UNTOUCHED (fix commit touches only 2 web files; servers.service/controller unchanged; AuthGuard + owner_id!==userId 403 intact)"
    - "web 603/603 · api 764/764 · typecheck clean · web build clean"
  rationale: >
    Attempt 2 closes the sole open finding from attempt 1. The post-save reconcile is now
    connected at both ends of the ChannelSidebar seam — refetchDetail is destructured from the
    context and passed as onSaveSuccess into ServerOverviewSettings, whose onSaveSuccess?.() fires
    only on the success path after a persisted update. The new seam test exercises the real
    ChannelSidebar call path (spy injected as the context value, not as an injected prop), so a
    future dangling wire fails the suite — the precise contract-drift blind spot that let attempt 1
    ship a no-op is now covered. All five previously-closed findings and the server-side owner-authz
    gate are untouched (the fix commit modifies only two web files). Full suites green (web 603/603,
    api 764/764), typecheck and web build clean. No new scale infrastructure introduced. This is the
    final B-6 verdict: APPROVED. Carry to C-block: the live-DB integration tests (incl. private-
    exclusion) must run GREEN in CI (they skip locally without DATABASE_URL_TEST).
  next_action: PROCEED_TO_C-1
```
