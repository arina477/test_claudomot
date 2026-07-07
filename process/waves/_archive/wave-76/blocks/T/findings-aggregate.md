# Wave 76 — T-block findings aggregate

Canonical V-2 input. Findings surfaced with evidence; T-block does NOT decide blocking (V-2 triages).

| # | Severity | Layer | Location | Description |
|---|---|---|---|---|
| 1 | low | T-4 | educator-tools /analytics + /status | Spec text says unknown serverId → 404; live composed guard returns 403 uniformly (EntitlementGuard free-default + RbacService.can default-deny). Security-positive (no server-existence enumeration); matches primary spec block 682e0912's own "non-member → 403" AC. Recommend reconciling the /status + /analytics spec text to 403. Non-blocking. |
| 2 | low | T-5 | apps/web/src/shell/ServerOverviewSettings.tsx (educatorToolsEnabled effect) | Mid-session tier upgrade (free→school) does not re-reveal the console until a page reload; the getServerPlan effect does not re-run on an external tier change, so an already-open settings surface keeps `gated` false. Fresh loads always render correctly. UX follow-up (re-fetch plan on tier-change or on settings-open). Non-blocking. |

## Test-environment note (not a product finding)
Two throwaway SuperTokens users were created for T-8 no-IDOR setup, then their app-DB rows + memberships were fully deleted; their SuperTokens-core auth identities remain (ST core unreachable from the test host) but are orphaned (no app-DB row, unverified, unusable). The definitive no-IDOR proof used verified Fixture B, not the throwaway users. Prod app data left clean: no school-tier servers, no test roles/members remain.
