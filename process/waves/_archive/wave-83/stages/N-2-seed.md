# N-2 — Seed (wave-83 → seeds wave-84)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: 9535895f-1d80-4a59-b93e-dff05ff94c6e"
  - "bundled siblings: 0"
  - "validation: pass (status=todo, wave_id=NULL, milestone_id=NULL, parent_task_id=NULL)"
  - "premise check: HOLDS (real gap remains — not self-healed)"
seed_task_id: 9535895f-1d80-4a59-b93e-dff05ff94c6e
seed_task_title: "Harden session-token storage: httpOnly cookies vs JS-readable header mode"
bundled_sibling_ids: []
claimed_task_ids: [9535895f-1d80-4a59-b93e-dff05ff94c6e]
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: "single-spec seed; no active milestone (roadmap complete, bug-fix phase)"
```

## Rationale (one line)

Highest-leverage security item in the bug-fix queue — ceo-reviewer (wave-83 P-0)
soft-flagged JS-readable session tokens as a real XSS exfil surface (MEDIUM);
premise verified to still hold in current code, so it is a live gap worth a wave.

## Premise verification — HOLDS (real gap remains)

**Task premise (9535895f):** SuperTokens runs in HEADER token-transfer mode because
neither `Session.init()` sets `tokenTransferMethod`, so session tokens arrive as
JS-readable `st-access-token` / `st-refresh-token` response headers rather than
httpOnly cookies (XSS-exposure surface). Server-side `cookieSameSite:none` /
`cookieSecure:true` config is present but never exercised.

**Verification against CURRENT code (2026-07-09):**

- `apps/api/src/auth/supertokens.config.ts:108-187` — the server `Session.init({...})`
  sets `cookieSameSite`, `cookieSecure`, and getSession/refreshSession override
  functions, but does **NOT** set `tokenTransferMethod`. SuperTokens defaults to
  `'any'` transfer mode → JS-readable response headers persist. The prepared
  cookie config remains un-exercised, exactly as the task describes.
- `apps/web/src/auth/supertokens.ts:27` — the web `Session.init()` is bare; no
  `tokenTransferMethod` either.
- Grep `tokenTransferMethod|getTokenTransferMethod` across the repo (excl.
  node_modules): **zero matches** in either app's source. The setting has never
  been introduced.

**Result: PREMISE HOLDS.** Unlike this wave's dropped ParseUUIDPipe candidate
(premise evaporated / self-healed by prior waves), the httpOnly-cookie gap is real
and unfixed. Seeding it is warranted.

## Bundle shape

Single-spec seed (0 siblings). head-next endorsed keeping WIP tight: an
httpOnly→CSRF companion (peer task f8fb8023) is a legitimate coupling only IF
wave-84's own P-block / T-8 surfaces that the cookie transport change forces an
explicit anti-CSRF setting. That is a P-block scope decision for wave-84, not a
pre-bundle here. Auth-transport change needs its own T-8 (per the task's own
"its own security wave" note).
```
