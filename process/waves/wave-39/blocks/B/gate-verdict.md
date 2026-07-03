# Wave 39 — B-6 Verdict

**Reviewer:** head-builder (fresh spawn, Phase-1 independent verdict)
**Reviewed against:** process/waves/wave-39/blocks/B/review-artifacts.md
**Attempt:** 1  (1 = first gate, 2+ = post-rework)

## Verdict
APPROVED

## Rationale
The wave delivers exactly its spec contract — wiring the dead `ChannelSidebar` settings button into a small `role=menu` popover over three EXISTING routes (Profile → `/settings/profile`, Privacy → `/settings/privacy`, Log out → `Session.signOut()` then `/login`), with no gold-plating (no new settings pages/panels, guardrail respected). Every acceptance criterion is met and verified against the real codebase, not just asserted:

- **Contract fidelity (frontend-only, no drift):** B-1/B-2 correctly SKIP — no Zod/DTO/API/schema surface. No new deps, no env vars, no migration (Drizzle or Dexie) — nothing that could cause schema drift or data loss. All three target routes (`/login`, `/settings/profile`, `/settings/privacy`) confirmed registered in `apps/web/src/router.tsx`; all three icons (`GearIcon`, `LockKeyIcon`, `SignOutIcon`) confirmed exported from `apps/web/src/shell/icons.tsx`.
- **Pattern reuse is faithful, not merely claimed:** `UserMenu.tsx`'s outside-click + Escape `useEffect` mirrors the shipped `AddReactionPopover` (`MessageList.tsx:612`) structure line-for-line (`popoverRef` + `anchorRef`, `mousedown` outside-click with anchor-exclusion, keydown Escape), plus an a11y IMPROVEMENT — Escape returns focus to the trigger. The anchor-exclusion (`!anchorRef.current.contains(e.target)`) also prevents the classic open-then-instantly-close bug, since the button's own mousedown is excluded.
- **Log out correctness (no race):** `signOut` import (`import Session from 'supertokens-auth-react/recipe/session'`) matches the app's own `auth/supertokens.ts` exactly; the action `await Session.signOut()` THEN `navigate('/login')` — navigation is correctly sequenced after the session-clear resolves, so protected routes bounce to login as specified. `handleSelect` closes the menu before running the action, satisfying close-on-select for all three items.
- **a11y:** trigger carries `aria-haspopup="menu"` + `aria-expanded={menuOpen}` reflecting state; popover is `role="menu"`; items are `role="menuitem"`; Escape closes + refocuses trigger; outside-click closes. No focus-trap gap for this small transient menu (Escape/refocus + outside-click cover the exit paths).
- **No regression:** the settings button's existing content (avatar, presence dot, display name/username, hover action icons) and hover styling are fully preserved; only wiring (`onClick`, aria attrs, `ref`) and a `relative` container class were added.
- **Test honesty:** 7 tests genuinely assert behavior (three items rendered; per-item navigate target + onClose; Log out asserts `signOut` called + `navigate('/login')` + onClose via `waitFor`; Escape close + focus-return; outside-mousedown closes; inside-mousedown does NOT close). `Session.signOut` and `useNavigate` are properly mocked. Re-ran locally: 7/7 green (135ms). Full suite 340/340, typecheck exit 0, biome ci 0 errors.

No unguarded-door concern (frontend navigation over routes already guarded server-side by their existing AuthGuard; logout uses the existing SuperTokens SDK — no client-held secret). No realtime, idempotency, pagination, or offline-outbox surface in scope. Nothing to REWORK; proceed to Phase-2 `/review`.

## Escalation  (only if ESCALATE)
n/a

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3

---
## Phase 2 — code-reviewer + fix-up
- C1 CRITICAL (logout no error-handling → strands user on reject) → FIXED 91bcb5a (try/catch/finally, navigate('/login') always runs).
- H1 HIGH (onClose before async → orphaned error) → FIXED 91bcb5a (act-then-close).
- MEDIUM opening-focus → added; arrow-roving accepted-debt. New [C1] reject-path guard test.
- Re-verify: typecheck 0, biome 0, 341 tests.
## B-6 verdict: APPROVE → B-block EXIT → C-block
