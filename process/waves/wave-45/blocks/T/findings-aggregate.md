# Wave 45 — T-block findings aggregate

Canonical V-2 input. Each finding: id, severity, layer, location, description, evidence. T-block surfaces; V-2 classifies blocking/non-blocking/noise.

| id | severity | layer | location | description |
|---|---|---|---|---|
| F1 | low (coverage-gap) | T-2 unit | apps/web/src/shell/useTyping.ts:65 buildTypingLabel | Pure transition-table function (5 branches: 0/1/2/3/4+ typers) has NO dedicated unit test. The 4e994e96 biome change swapped typers[N]! for typers[N] as Typer claiming byte-identical output; no unit test locks that claim as a transition table. Pre-existing gap (not introduced by this wave); CI typecheck + 354 unit tests + e2e green cover compilation + integration. Non-blocking — candidate for T-2.md discipline note / L-2 debt. |

## Evidence detail

### F1 — buildTypingLabel unit-test gap
- grep -rn "buildTypingLabel|typingLabel|useTyping|is typing|Several people" src --include="*.test.ts*" -> NO matches (0 dedicated tests).
- Function is exactly the "conflict-resolution matrix / cursor encoding tested as transition tables" shape T-1 principles flag; behavior-preserving refactor is the ideal moment to lock it, but was not.
- Severity low: the wave did not regress it (byte-identical claim reviewed against source — each cast bound after its length guard); CI is green; this is debt not a defect.

---

| F2 | medium (test-honesty debt) | T-5 e2e | apps/web/e2e/delete-any-message.spec.ts:146-162 | Two-client realtime fan-out (message:deleted to client B) is a SOFT-CHECK: it waits 8s then logs DELIVERED/NOT_DELIVERED_IN_WINDOW and passes REGARDLESS. Observed this run: NOT_DELIVERED_IN_WINDOW. This is the single-client-realtime anti-pattern — the cross-client delivery is not actually proven by the assertion (test stays green even when fan-out is missed). PRE-EXISTING (wave-44 code, untouched by wave-45); OUT OF wave-45 scope (wave-45 = runner fix only). The RBAC/IDOR portions of the same spec (mod-delete affordance visible to A step 6, hidden to non-mod B step 8) ARE hard-asserted and passed. Backend fan-out separately proven at wave-41 T-4/T-8 integration. Surfaced for V-2 as debt; recommend a deterministic fan-out assertion (await joinChannel ack before delete) in a future test-hardening wave. |

## Evidence detail

### F2 — delete-any-message fan-out soft-check
- Run log (wave-45 T-5 full suite): `[E2E ca43eb12] Socket fan-out to B: NOT_DELIVERED_IN_WINDOW (backend proven wave-41)` — test still `passed`.
- spec lines 153-162: `.catch(() => false)` + `console.log` + pass; no `expect(...)` gates the fan-out outcome.
- Scope boundary: wave-45 touched only playwright.config.ts + package.json + useTyping.ts. This spec's assertion logic is wave-44's. head-tester does NOT block wave-45 on pre-existing wave-44 test debt; V-2 classifies.
- head-tester note: this is a legitimate two-client-verification gap for the delete fan-out path specifically. It does NOT undermine the wave-45 acceptance proof (runner launches bundled chromium + executes the suite), which is fully met.
