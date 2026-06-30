# Wave 15 — V-3 Verdict

**Reviewer:** head-verifier (fresh spawn)
**Reviewed against:** process/waves/wave-15/blocks/V/review-artifacts.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
Both V-1 reviewers APPROVE on evidence, not assertion, and both clean verdicts survive the false-negative probe rather than reading as rubber stamps. Karen traced the two load-bearing chains to real, line-cited, mutually-consistent code — the username-resolution chain CLOSES end-to-end (autocomplete inserts the canonical `member.username` at MentionAutocomplete:199-203 → shared `ServerMember.username` → `listServerMembers` selects it at servers.service:241 → parser lowercases tokens at mentions.ts:41 → resolver `lower(users.username)=ANY(tokens)` with `username IS NOT NULL` at messages.service:178-183; both ends case-fold, so the F-4/wave-14-class "insert X / match Y" trap is genuinely absent) and mention-realtime is genuinely wired (per-user `user:<id>` room joined from the verified session at gateway:107, one `mention.created` per recipient with server-side author exclusion at service:337, fanned only to the recipient room at gateway:240). Karen ran a control probe (`/me/bogus` → 404) to prove the 401 on `/me/mentions` is a meaningful guard, not a catch-all. jenny independently confirmed 3/3 specs MATCH with a per-AC cross-reference and a `git diff --stat fd86540 HEAD = empty` proof that the audited source is byte-identical to the deployed revision; she found ZERO drifts and explicitly separated drift from the carried/non-blocking GAPS. Triage quality is sound: the fast-fix queue is correctly EMPTY because every finding is non-blocking and explicitly dispositioned. The feature is verified-real in BOTH code (Karen + jenny) AND live (T-block two-client: mention realtime alive cross-channel, my-mentions IDOR-closed, membership-scoped resolution, no self-badge), plus an independent spot-check this gate ran (`GET /me/mentions` unauthed → 401). This clears the acceptance-by-assertion bar — "done" is demonstrated against the spec ACs, not inferred from green tests.

### Triage re-classification audit (no finding mis-classified as non-blocking)
- **T4-F1 / G1 (no real-PG integration tier for message_mentions):** Confirmed NON-blocking. This is a test-coverage gap, not a behavior gap — the UNIQUE / ON DELETE cascade / index constraints exist live in migration 0007 and the path is exercised by live T-8 two-client + the boot-probe + C-2 prod-verify. Disposition is acceptable and explicitly NOT a silent carry: mapped to existing task 02fa8011 with a bumped 2-wave-recurrence note, with an owner — surfaced, not buried. (If it recurs a 3rd wave unaddressed, it should escalate to a blocking scheduling decision; this wave it is correctly accepted.)
- **M-2 / G3 (client/server token parity, interior-dot handles):** Confirmed NON-blocking. Pills render only for tokens present in the server-resolved `mentions[]`; any tokenizer divergence degrades to plain text — no false pill, no security exposure. Cosmetic worst-case. New-task disposition correct.
- **M-4 (edit-diff delete+insert not transactional), T5-F1 (Playwright MCP chrome channel):** robustness / tooling, correctly tasked. M-1 / M-3 / L-1..L-6 correctly accepted as noise/opportunistic.

No spec-gap finding requiring ESCALATE (jenny found no ambiguous/missing AC). No B re-entry: 0 blocking, 0 critical/high from T-block, both reviewers APPROVE, no green-by-suppression (no finding closed by weakening a test or loosening an assertion). The journey-map and product-decisions referenced reflect as-shipped behavior (T-9 regen on top of the deployed feature commit; jenny confirms M3 correctly NOT closed — threads/attachments remain).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
