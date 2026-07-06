# V-1 Karen — wave-66 Reality Verification

**Agent:** Karen (Project Reality Manager)
**Stage:** V-1 Review
**Wave:** 66 — StudyHall — neutral offline empty-state copy for never-synced server channels
**Merge under test:** `d094f9c` on `main` (PR #81 squash-merge), HEAD confirmed `d094f9c6e8445805b3207c0837be97473a1b66f0`
**Date:** 2026-07-06

## Verdict: APPROVE

All four load-bearing claims verified TRUE in the merged/deployed state. This is a presentation-only copy change; scope matches claim; no over/under-engineering; tests are deterministic and pass green. No gaps.

---

## Claim-by-claim findings

### Claim 1 — ChannelSidebar error branch split by connection state — TRUE

`apps/web/src/shell/ChannelSidebar.tsx:338-346` (the `detailStatus === 'error'` block):

```
{selectedId && detailStatus === 'error' && (
  <div className="px-2 py-6 text-center">
    <p ...>
      {connectionState === 'offline' || connectionState === 'reconnecting'
        ? "This server isn't available offline yet — reconnect to load its channels."
        : "Couldn't load channels."}
    </p>
  </div>
)}
```

- Condition present, **not inverted**: offline/reconnecting → neutral copy; else (online) → preserved "Couldn't load channels." — `ChannelSidebar.tsx:341-343`.
- `useConnectionState` imported once (`ChannelSidebar.tsx:33`) and called **exactly once** (`ChannelSidebar.tsx:179`, `const connectionState = useConnectionState();`). No duplicate hook call.
- Neutral copy wording matches the claim ("This server isn't available offline yet — reconnect to load its channels.").

### Claim 2 — Test split into 3 deterministic per-state cases replacing the old single test — TRUE

`apps/web/src/shell/shell-components.test.tsx`:
- `useConnectionState` mocked at module level, default `'offline'` — `test.tsx:35-39`.
- `beforeEach` resets mock to `'offline'` to prevent leak across cases — `test.tsx:236-238`.
- Three cases, each overriding the mock and asserting **mutual exclusion** (positive copy present AND the other copy absent):
  - offline → neutral, not "couldn't load channels" — `test.tsx:303-308`.
  - reconnecting → neutral, not "couldn't load channels" — `test.tsx:310-315`.
  - online → "couldn't load channels", not neutral — `test.tsx:317-322`.
- **Old single test confirmed replaced, not appended:** pre-merge `d094f9c~1:shell-components.test.tsx:289-290` had one error case (`detailStatus: 'error'` → asserts only `couldn't load channels`). Post-merge that block is gone, superseded by the 3 cases above. (The surviving `queryByText(/couldn't load/i)` at `test.tsx:300` is an unrelated negative assertion inside the *loading*-state test — correctly untouched.)

### Claim 3 — No apps/api change; deploy serves d094f9c — TRUE

- `git show --stat d094f9c` → apps/api file count = **0**. Only `apps/web/src/shell/ChannelSidebar.tsx` (7 lines) and `apps/web/src/shell/shell-components.test.tsx` (33 lines) under `apps/`; remainder is `command-center/` + `process/` docs.
- Deploy: independently probed the real web host from `project.yaml:65` (`web-production-bce1a8.up.railway.app`) → **HTTP 200**, serves `<title>StudyHall</title>`. Commit-hash match relies on C-2's authoritative Railway deployment-state check (SUCCESS @ d094f9c per handoff); SPA HTML carries no embedded commit, so probe corroborates liveness, C-2 owns the SHA binding. Consistent.
- (Note: the URL guessed in the handoff prompt, `studyhall.up.railway.app`, is NOT the deploy target and 404s — the canonical host is in `project.yaml:65`. No impact on verdict.)

### Claim 4 — Shell test suite green — TRUE (re-run locally)

`npx vitest run src/shell/shell-components.test.tsx` → **18 passed / 18**, including all 3 new connection-state cases. Duration 253ms, deterministic (no retries, no flake). Full 565/565 not re-run here (only the load-bearing file was in scope), but the changed file's suite is green and the change is presentation-only with no cross-file surface.

---

## Gap register

| # | Gap | Severity |
|---|-----|----------|
| — | None. All claims hold with file:line evidence. | — |

## Reality assessment

Claimed = actual. A genuinely tiny, well-scoped copy change: one branch condition reusing an existing hook, three deterministic tests asserting mutual exclusion, zero backend blast radius. No false-completion, no gold-plating, no fragile paths. Nothing to fast-fix at V-3.

## Downstream note (advisory, non-blocking)

The neutral vs. error copy is driven purely by `useConnectionState`, not by *why* the detail fetch failed — an online-but-server-side 500 correctly shows "Couldn't load channels.", and an offline never-synced server correctly shows the neutral copy. This is the intended behavior per the commit message ("no false comfort during a real failure"). Confirmed correct, not a gap.
