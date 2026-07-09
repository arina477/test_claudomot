# L-1 — Docs (wave-86)

Backend-only CSRF-posture legibility wave. Owner: head-learn. Mode: automatic.

## Action 1 — CHANGELOG entry

Appended one bullet under `## [Unreleased] → ### Changed` at `CHANGELOG.md:126`:

> Made the API's cross-site-request-forgery protection explicit and added a permanent test guarding it, so a forged request carrying only a cookie is provably rejected and the security posture can't silently regress. No change to how you log in. (#106)

Section choice: **Changed**, not **Security**. Per L-1 Action 1, the Security section is reserved
for a vulnerability that DID ship to users in a prior wave and is patched after the fact. This wave
resolves the wave-49 finding but there was **no live vulnerability** — a cookie-only cross-site
request was already rejected (header transport). The change is legibility (explicit `antiCsrf: 'NONE'`)
plus a permanent regression test. This matches the prior in-wave security-hardening entries (#102,
#103/#104) that also sit under Changed with a "No change to how you log in" tail.

Committed FS-side: `docs: L-1 wave-86 closeout (changelog)` → SHA `14993c0c`, pushed to main.

## Action 2 — Milestone delta — SKIP

Claimed task `f8fb8023-544a-431f-a359-7392e9c75f5b` has `milestone_id IS NULL` (unassigned
bug-fix queue; roadmap complete). No milestone progressed. Skip recorded per Action 2 skip clause.

Verified:
```
SELECT id, status, milestone_id FROM tasks WHERE id='f8fb8023-544a-431f-a359-7392e9c75f5b';
-- f8fb8023 | done | (null)
```

## Action 3 — README touchups — SKIP

No user-facing usage / CLI / flag / env-var / install / breaking change. The change is an internal
backend security-config value + a regression test + dev-facing CSRF-safety docs. Nothing in the
README's usage/env/quick-start surface changed. Skip recorded per Action 3 skip clause.

## Action 4 — Commit

FS-side batched commit (CHANGELOG only; milestone skip → no DB write): `14993c0c`, pushed to main.

## Deliverable footer

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:126"
  - "changelog commit: 14993c0c (pushed to main)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "claimed task f8fb8023 has milestone_id IS NULL (unassigned bug-fix queue; roadmap complete)"
readme_sections_touched: []
note: "Backend-only CSRF-posture legibility wave; no user-facing usage/env/CLI change; no milestone. Security-section not used (no shipped vuln)."
```
