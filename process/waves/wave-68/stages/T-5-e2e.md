# T-5 — E2E (live) — wave-68

**Layer:** T-5 E2E · **Head:** head-tester · **Mode:** automatic
**Deployed merge:** 1b5a184 (BOTH services SUCCESS) · **Prod:** web `web-production-bce1a8`, api `api-production-b93e`
**Fixture A (owner):** studyhall-e2e-fixture (userId `21984eb2-…`, owns all 573 servers incl. target)
**Target server:** `ad62cd12-b78e-4a85-a214-042cf176b16c` "Fixture Proof Server" — owned by A, DB ground-truth member count = **2**
**Playwright MCP:** playwright-1 (session was pre-authenticated as fixture A; desktop viewport 1440×900). NOT closed.

## The full loop — NOW testable for the first time (write-half + memberCount fix)

| Step | Action | Result |
|---|---|---|
| Baseline | `GET /servers/discover` before publish | **0 servers** (honest cold-start empty — write-half never exercised) ✅ |
| 1 | Open server A owns → gear → **Overview** settings surface | Dialog opens `role=dialog data-testid=server-overview-settings`; publish `role=switch` `aria-checked=false`; Description textarea empty; Topic input empty — **PRE-POPULATED from real state (unpublished/empty initially)** ✅ |
| 2 | Toggle publish ON + Description + Topic → **Save Changes** | switch→`true`; `PATCH /servers/ad62cd12` → **200** (network req #31), followed by GET refetch #32 (post-save reconcile). **Write PERSISTED to Postgres** (`is_public=t`, desc + topic set — verified via public-proxy psql). ✅ |
| 2b | Close (Esc) + reopen Overview | Dialog RE-POPULATES from persisted state (switch=true, desc+topic present) — **the B-6 post-save reconcile holds; NO revert** ✅ |
| 3 | Navigate `/discover` | Directory flips **0→1**; card renders name "Fixture Proof Server", description, topic "Physics · Study Group", **"2 members"** (member icon), + **Join** affordance. UI-level AND API-level. ✅ |
| 3b | memberCount correctness | `GET /servers/discover` memberCount = **2** == DB ground-truth (2 rows in server_members). NOT 0. **The wave-67 memberCount:0 bug is fixed live.** ✅ |
| 4 | Join affordance | "Join" button present on the card (server is joinable; reuses wave-67 membership core). ✅ |
| 5 | Unpublish (toggle OFF + Save) | switch→false; server DISAPPEARS from `/discover` (directory **1→0**). **Retract works both ways.** Partial update: description/topic RETAINED (only is_public changed) — matches partial-PATCH AC. ✅ |

## Evidence
- Screenshots: `/home/claudomat/project/t6-discover-card-populated.png` (published card, "2 members", Join), `/home/claudomat/project/t6-overview-settings-surface.png` (Overview settings, dark theme, char counters).
- Network: PATCH /servers/ad62cd12 → 200; GET refetch reconcile; discover 0→1→0 across publish/retract.
- DB ground-truth cross-checks via public proxy at each write (member count 2, persisted is_public/desc/topic, retract to false).
- Accessibility-as-contract honored: driven by `aria-label` (rail icons, settings gear) + `role=switch` + `role=dialog` — no `getByTestId`-only queries where a role/label existed.

## Verdict
```yaml
stage: T-5
layer: e2e
verdict: PASS
evidence_mode: live-prod + db-ground-truth cross-check
loop_closed: true      # publish → /discover → memberCount-correct → join affordance → unpublish/retract, end-to-end LIVE
member_count_fix: proven_live   # 2 == real count, was 0 in wave-67
post_save_reconcile: proven     # persists on close+reopen (B-6 fix, no revert)
flake: none            # 2 confirming runs
prod_left_clean: true  # target restored to private, /discover back to 0 public
```
