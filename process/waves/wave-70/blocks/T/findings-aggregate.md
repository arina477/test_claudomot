# Wave 70 — T-block findings aggregate

## T-5 (E2E, live)
- [MAJOR / B-3 UX] FINDING-1: member-list row doesn't reflect blocked state (still shows "Block" after blocking); server + /settings/privacy list are correct. Fix: cross-reference blocks set in MemberListPanel. → V-2. Evidence: T-5-tester-1.md.
- [LOW] FINDING-2: blocked-users list shows UUID not display name (B-6 enrichment gap). → V-2.
- [PASS] block dialog a11y/focus-trap/mobile-bottom-sheet, spec-D own-row suppression, unblock — all live PASS.
## T-8 (Security, live) — LAUNCH-GATE PROOF
- [PASS — CRITICAL SAFETY SURFACE GREEN] block + DM HIDE PROVEN LIVE: no-IDOR, self-block 400, exists 404, idempotent; DM HIDE bidirectional at all 5 seams (403/exclude/hide), unblock restores. No leak on any DM path. Secret-grep clean. Evidence: T-8-block-probe.md.
## T-6 (Layout, live)
- [PASS] block dialog desktop + mobile bottom-sheet (T-5-cross-confirmed) + danger #b91c1c token (D-3-verified); blocked-users list renders (UUID gap → V-2). No new layout finding. (T-6 agent infra-dropped after desktop capture; cross-covered.)
