# L-1 — Docs (wave-75)

**Block:** L (Learn), stage L-1 (∥ L-2). **Mode:** automatic.
**Wave-75 shipped LIVE + V-block APPROVED** (karen + jenny + head-verifier, 0 blocking; merge `3b94e276`).
Content: BillingProvider seam + MockBillingProvider + owner-only tier-change endpoint + GET plan; real `TIER_CAPS` + educator-tools `EntitlementGuard`; "Your plan" panel + mock upgrade UI. (#93)

## Action 1 — CHANGELOG entry

Appended one **Added** bullet under `## [Unreleased] › ### Added` at `CHANGELOG.md:96`.

Wave-75 is user-facing (unlike wave-74's invisible substrate at #91/#92): server owners can now SEE their plan + limits and switch tiers through an in-app flow. Framed honestly and marked clearly test-mode (no real charge — billing not live yet).

```
- Server owners can now see their server's plan (Free / Server Pro / School) and its storage, call, and educator-tools limits under Settings › Overview, and switch plans through a test-mode checkout — no real charge, since billing is not live yet. Switching takes effect immediately, so a higher plan's limits (and educator admin tools on School) unlock right away. (#93)
```

## Action 2 — Milestone delta

**M9 — Monetization: freemium tiers** (`3e507bc0-bce5-4f3b-b22a-d3c887fc0548`) — **stays `in_progress`. No transition.**

- Wave-75's 3 claimed tasks flip to `done` at L-2 (runs in parallel): `4bc40741` (BillingProvider seam + mock tier endpoints), `69765cee` (real `TIER_CAPS` + educator gate), `77665ee5` ("Your plan" panel + mock upgrade).
- Open-task count at L-1 read time: **open_count=6** (3 wave-75 tasks still `in_progress` pre-L-2 + 3 unseeded). After L-2 marks the 3 wave-75 tasks `done`, **open_count drops to 3**:
  - `db90252a` — createServer entitlement gate TOCTOU (move gate inside transaction)
  - `ecf79f4a` — owner/member authz check on the educator-tools endpoint
  - `ab75b8d8` — merge PR #94 (pg-harness subscriptions upsert integration test)
  - PLUS the real-Stripe-charging work still to decompose (keys + live Checkout/webhooks/customer-portal).
- **Not closeable.** M9's remaining scope is REAL Stripe charging, which is founder-reserved — needs founder-issued Stripe API keys (account-issued credential, rule 6). Milestone `## Still fenced` prose already records this. No `UPDATE milestones` executed.
- **Success metric — MET LIVE at T-5.** M9's `## Success metric` prose ("a server can self-upgrade free→server_pro through the (mock) checkout and the higher entitlements take effect immediately, verified live in production") was met live in production this wave. The success-metric prose was authored earlier and already reflects both the mock-flow metric (now met) and the deferred business metric (paid-conversion rate — activates with real Stripe). No prose edit required; the definition already stands. Recorded here for the milestone record.
- **No milestone-disposition judgment call** — M9 is mechanically still open (real-charging scope unshipped + founder-reserved), so no `automatic`-mode BOARD escalation per the Action-2 mode-routing table. Mechanical, unambiguous.

### N-1 note (backlog survey input)

M9 has open child tasks after L-2 (open_count → 3). N-1 surveys the next slice: autonomous hardening/follow-ups (`db90252a` TOCTOU, `ecf79f4a` educator-gate authz, `ab75b8d8` PR#94 merge — all brain-ownable) vs the founder-reserved real-Stripe slice (still to decompose, blocked on founder keys). N-1 picks the claimable autonomous slice; the real-Stripe slice stays fenced until the founder provides keys.

## Action 3 — README disposition

**Skipped — reason: no user-facing product-feature surface in README.** `README.md` is a wave-loop operational doc (sections: Live / What this repo is / Quick start / How to start a wave / Modes / Conventions). It documents how to run + operate the brain, NOT end-user product features. No new CLI command, flag, env var, or install step shipped this wave. The "Your plan"/billing surface is a product feature → belongs in CHANGELOG (done), not README. Edit would be off-scope for this README's purpose.

## Action 4 — Commit

FS docs (CHANGELOG only) committed + pushed to `origin main`. SHA recorded in footer.

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md:96 (Added — #93 mock-billing tier-change + Your-plan panel)"
  - "milestone M9 3e507bc0: NO transition (stays in_progress; real-Stripe founder-reserved rule 6)"
  - "commit SHA: 9bfadab9296d637245a0d87161abb41c748ce0be (CHANGELOG.md carrier)"
changelog_entry_added: true
roadmap_milestones_progressed:
  - {milestone: "M9 — Monetization: freemium tiers (3e507bc0)", before: "in_progress", after: "in_progress"}
roadmap_skip_reason: ""
readme_sections_touched: []
note: >
  M9 stays in_progress — mock upgrade path shipped LIVE, but real Stripe charging
  (keys + live Checkout/webhooks/customer-portal) is founder-reserved (rule 6, needs
  founder-issued keys). Open_count 6 at L-1 read (3 wave-75 tasks flip to done at L-2
  → 3 open: db90252a TOCTOU, ecf79f4a educator-gate authz, ab75b8d8 PR#94 merge, +
  real-charging still to decompose). Mock-flow success metric MET LIVE at T-5
  (self-upgrade free→server_pro, entitlements immediate, verified in prod); business
  metric (paid-conversion) activates with real Stripe. N-1 surveys the autonomous
  hardening slice vs the founder-reserved real-Stripe slice. README skipped (operational
  doc, no product-feature surface).
```
