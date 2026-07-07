# Wave 73 — B-6 /review output (Phase 2)

Independent adversarial code-reviewer over the audit-log diff, origin/main..HEAD.

## Verified SAFE (high-risk structural concerns)
- **Module cycle:** BlocksModule→PrivacyModule is one-way; PrivacyModule imports only Users/Auth (no back-edge). No DI cycle → no boot white-screen.
- **Hook reliability:** all 4 hooks await-inside-try/catch, log-and-swallow, fire strictly AFTER the underlying action commits; idempotent delete early-return does NOT log account_deleted. No path where a logging error fails/rolls back the user action.
- **Contract shape:** listForActor mapping produces EXACTLY the shared PrivacyEvent (createdAt ISO string, context null not {}, targetId nullable) → web safeParse passes.
- no-IDOR (session-only callerId, no param), SQL parameterized + LIMIT 100 bounded, XSS none (static labels, React-escaped), frontend null-safety + all 4 render states present, migration 0028 correct, Zod enum guard at insert.

## Findings (all P2, ledger-quality/UX — fixed same-branch since 2 corrupt a permanent append-only ledger)
- **[P2 8/10] removeBlock false event:** logs user_unblocked even when nothing was unblocked (unconditional delete+append) → FIX: gate append on delete `.returning().length > 0`.
- **[P2 8/10] createBlock false event:** logs user_blocked on the idempotent conflict path (re-block spams ledger) → FIX: gate append on `insertReturning.length > 0`.
- **[P2 7/10] visibility label collapse:** everyone + server-members both render "Visible to classmates" → "(X → X)" noise → FIX: suppress the parenthetical when from-label === to-label.
- **[P2 6/10] no-op settings event:** re-saving identical settings logs a from===to event → FIX: skip the append when before === after (no genuine change).

## INVESTIGATE (accepted, non-blocking)
- Unbounded append latency (no timeout on the awaited appends) — same shape as the shipped revokeAllSessionsForUser await; single tiny INSERT. → accepted; future timeout-wrapper candidate.
- account_deleted unreadable by its own actor (re-auth blocked post-delete) — working-as-designed (evidence/audit, not user-facing).

## Disposition
Reviewer recommendation: ship-as-is (no blocker) but fix the 2 false-event gates pre-merge (permanent append-only ledger). Fixing all 4 P2s same-branch (cheap): backend-developer (3 backend gates) + react-specialist (panel display). Then re-verify B-4/B-5.
