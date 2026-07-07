# Wave 69 — T-block findings aggregate

## T-5 (E2E, live)
- [MAJOR / B-3 frontend] Own-content Report-affordance leak. MainColumn.tsx:343 passes currentUserId={profile?.username} but MessageList compares vs msg.authorId (UUID) → isOwn always false → Report shows on own message/member; own-message Edit missing; Delete shows moderator label. FIX: currentUserId={profile?.userId ?? null} (profile.userId exists, used at :296). Non-security (reporter_id server-derived). Pre-existing wiring bug exposed by the report affordance. Evidence: T-5-tester-1.md.
- [LOW / test-infra] Playwright MCP shared single Chrome profile serializes parallel testers (blocked tester-2 visual scenarios). Not a product defect.
- [PASS-note] Server-side authz PROVEN live at API: owner GET /servers/ad62cd12/reports→200; non-mod B→403; resolve dismiss→200+status flip+leaves open queue. Report submit: POST /reports 201, reporter_id server-derived, correct target.

## T-8 (Security, live)
- [PASS — CRITICAL SURFACE GREEN] All 4 authz paths PROVEN LIVE on deployed revision: no-IDOR (spoofed reporter_id ignored), moderate_members (A200/B403 both live), rank-guard (403, no side effect), cross-server tamper (404 pre-mutation). Secret-grep clean. Evidence: T-8-authz-probe.md.
- [INFO] rate limit present (10/60s) — the P-block "no rate limit" deferral does not reproduce.
- [LOW / hardening, not wave-specific] x-powered-by: Express exposed → V-2 (optional hardening).

## T-6 (Layout, live)
- [CRITICAL / B-3 frontend] T6-M1: mobile (375px) report inbox unreachable — fixed inset-0 overlay is inside ChannelSidebar drawer's translateX(-260px) transform → transformed ancestor is the containing block for fixed → inbox parked off-screen (x=-188, width=260). Desktop 1440 PASS. FIX: portal ReportInbox overlay to document.body. Evidence: T-6-layout/screens/inbox-mobile-375*.png.
- [PASS] Desktop inbox layout faithful to D-3; tokens all correct (danger #b91c1c, emerald #10b981 dark text, ghost dismiss, Phosphor SVG, Geist).
