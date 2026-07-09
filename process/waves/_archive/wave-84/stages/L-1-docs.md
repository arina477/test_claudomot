# L-1 — Docs (wave-84)

**Owner:** head-learn (L-block gate, mode: automatic)
**Wave:** Session-token XSS-hardening — kept SuperTokens header token transport (BOARD 7/7 Option B), shipped compensating XSS controls (explicit header transport, 900s access-token TTL, refresh rotation, cross-origin-safe CSP naming every real outbound origin). Deployed live at 5cb5e789.
**V-block entry:** APPROVE (karen + jenny + head-verifier).

## Action 1 — CHANGELOG entry

Appended one entry under `[Unreleased] › Changed` (CHANGELOG.md line 125). Backend/security hardening, mostly user-invisible; terse, one entry, plain-language, keep-a-changelog house style.

> - Hardened how your sign-in is kept secure: sign-in tokens now expire faster and refresh automatically, and a strict content-security rule limits what the app is allowed to talk to — while keeping sign-in reliable across every browser, including Safari. No change to how you log in. (#103, #104)

Section choice: **Changed** (existing sign-in flow modified; not a shipped-then-patched vulnerability, so not Security — the compensating controls are preventive, per L-1 Action 1 "Security section: shipped vulnerabilities patched after the fact only").

## Action 2 — Milestone delta

**SKIP.** The single claimed task `9535895f-1d80-4a59-b93e-dff05ff94c6e` has `milestone_id IS NULL` (came off the unassigned bug-fix queue; not attached to any milestone). Verified via DB:

```
SELECT id, status, milestone_id FROM tasks WHERE id='9535895f-...';
→ milestone_id = NULL
```

No milestone progressed → skip recorded per L-1 Action 2 skip condition ("wave's claimed tasks all had `milestone_id IS NULL`").

## Action 3 — README touchups

**SKIP.** Nothing user-facing changed in the app's usage: no new CLI command/flag, no new user-facing env var, no new install step, no breaking change. The wave is internal auth token-transport + CSP hardening (build-time VITE_ origin vars are deploy-infra config, already threaded in the Docker/CI layer, not a documented app-usage env). Skip recorded per L-1 Action 3 skip condition.

## Action 4 — Commit

FS-side touchups (CHANGELOG + L-block deliverables + rule-19 promotion) committed and pushed to `main`. See L-block commit.

## § BOARD decisions

| decision-slug | vote | resolution | dissent |
|---|---|---|---|
| wave-84-session-token-transport | 7/7 | Option B — keep SuperTokens header token transport (NOT httpOnly cookies) + ship compensating XSS controls (explicit header transport, 900s access-token TTL, refresh rotation, explicit cross-origin-safe CSP). Tier-3 6+/7 strict threshold cleared. | none — all seven APPROVE; all stressed the compensating-controls bundle (CSP + short TTL + rotation) as BINDING ship-blocking, not follow-up |

Rationale (audit): the P-0 reframe trio (problem-framer ESCALATE → ceo-reviewer SCOPE-REDUCTION → BOARD) caught that the naive httpOnly-cookie switch would trade a MEDIUM XSS surface for a HIGH auth-reliability regression — cross-SITE `SameSite=None` cookies are already blocked by Safari ITP and are being removed by Chrome's third-party-cookie deprecation, which would break login for real users on StudyHall's split web/api origins. Recorded in `command-center/product/product-decisions.md` (accepted posture + migration trigger).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:125 (Changed — sign-in hardening, #103 #104)"
  - "milestone delta: SKIP (task 9535895f milestone_id IS NULL)"
  - "README: SKIP (no user-facing usage/CLI/env change)"
changelog_entry_added: true
roadmap_milestones_progressed: []
roadmap_skip_reason: "claimed task 9535895f has milestone_id IS NULL (unassigned bug-fix queue); no milestone progressed"
readme_sections_touched: []
board_decisions:
  - slug: wave-84-session-token-transport
    vote: "7/7"
    resolution: "Option B — keep header transport + compensating XSS controls (header transport, 900s TTL, rotation, cross-origin-safe CSP)"
    dissent: "none"
note: "Backend/security hardening wave; mostly user-invisible. Milestone + README sub-actions both correctly skipped."
```
