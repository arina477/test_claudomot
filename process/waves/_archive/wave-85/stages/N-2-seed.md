# N-2 — Seed wave-86 (with premise verification)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: f8fb8023-544a-431f-a359-7392e9c75f5b"
  - "bundled siblings: 0"
  - "validation: pass (status=todo, wave_id NULL, milestone_id NULL, parent_task_id NULL)"
  - "premise-check: HOLDS (first candidate b84f7be9 EVAPORATED, dropped; f8fb8023 premise verified live in code)"
seed_task_id: f8fb8023-544a-431f-a359-7392e9c75f5b
seed_task_title: "Auth hardening: make SuperTokens anti-CSRF explicit (VIA_TOKEN) + regression test"
bundled_sibling_ids: []
claimed_task_ids: [f8fb8023-544a-431f-a359-7392e9c75f5b]
active_milestone_id: null
queue_exhausted: false
validation_failed: false
note: "Bug-fix phase — seed carries milestone_id NULL (legal). Single-task bundle."
```

## Candidate survey

Surveyed top 12 seedable rows (`todo`, `milestone_id NULL`, `parent_task_id NULL`, `wave_id NULL`, ORDER BY created_at). head-next recommended premise-checking **b84f7be9** (userB e2e fixture — recurring 2-client delete-any-message.spec.ts flake across wave-84+85) FIRST, then **f8fb8023** (anti-CSRF VIA_TOKEN).

## Premise-check #1 — b84f7be9 (userB e2e fixture) → EVAPORATED, DROPPED

**Task premise:** the userB fixture (`studyhall-e2e-fixture-b@example.com`) rejects sign-in with `WRONG_CREDENTIALS_ERROR`, blocking 2-client DM verification (source: V-2 triage of wave-46 V-1).

**Verification (2026-07-09):**
1. Registry (`command-center/testing/test-accounts.md`, gitignored) fixture-b password = `Tb8xKp2mQvWz5nRj7sLcDh3aEf9gYu4w`, SuperTokens user id `da74148e-132e-4faf-a526-a34c28e7481b`, email-verified.
2. The spec `apps/web/e2e/delete-any-message.spec.ts:90` hardcodes the SAME password as its `E2E_FIXTURE_B_PASSWORD` default — registry and spec agree.
3. **Live sign-in probe:** `POST https://api-production-b93e.up.railway.app/auth/signin` (rid: emailpassword) with the registry credential returned:
   ```
   {"status":"OK","user":{"id":"da74148e-132e-4faf-a526-a34c28e7481b",... "verified":true ...}}
   HTTP 200
   ```

**Verdict: PREMISE EVAPORATED.** Fixture-b signs in cleanly (status OK / 200 / verified). The `WRONG_CREDENTIALS_ERROR` blocker no longer exists — the credential was already re-provisioned since the wave-46 finding; registry, spec, and live all agree. No work remains. (The recurring delete-any-message e2e flake, if still present, is NOT caused by a bad fixture-b credential — that root cause is now falsified; any remaining flake needs fresh triage under its own finding, not this seed.)

**Action taken:** `UPDATE tasks SET status='cancelled'` on b84f7be9 with an appended cancellation note documenting the live-signin evidence.

## Premise-check #2 — f8fb8023 (anti-CSRF VIA_TOKEN) → HOLDS, SELECTED

**Task premise:** `SuperTokens Session.init` sets `cookieSameSite` without an explicit `antiCsrf` setting; make the posture explicit (`antiCsrf: VIA_TOKEN`) so it cannot silently regress, plus a regression test asserting a cookie-only forged POST is rejected. Source: wave-49 T-8 finding F-2 (pre-existing, project-wide, non-blocking — no live vuln today).

**Verification (2026-07-09):** Read `apps/api/src/auth/supertokens.config.ts` current code. The `Session.init({...})` block (lines 108–221) sets `getTokenTransferMethod: () => 'header'`, `cookieSameSite`, `cookieSecure`, and a getSession/refreshSession override — but **NO explicit `antiCsrf` option is present**. The wave-84 work added header transport but did not add `antiCsrf`.

**Verdict: PREMISE HOLDS.** The explicit `antiCsrf` setting is still absent. Well-scoped (single auth-config change + one regression test), security-relevant, single-spec, no siblings. Header transport already mitigates CSRF in practice, which reinforces the "make it explicit so it can't silently regress" hardening rationale — a clean, defensible next bug-fix-phase seed.

## Validation (Action 3)

```
id=f8fb8023-544a-431f-a359-7392e9c75f5b  status=todo  wave_id=NULL  milestone_id=NULL  parent_task_id=NULL
siblings (parent_task_id=f8fb8023, todo, wave_id NULL): 0
```

All checks pass → `claimed_task_ids = [f8fb8023-544a-431f-a359-7392e9c75f5b]` (single-task bundle).
