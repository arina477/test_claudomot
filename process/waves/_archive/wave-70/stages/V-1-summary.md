# V-1 — Summary (wave-70) — both reviewers APPROVE (deployed revision a2c006a)
## Karen (source-claim) APPROVE
All load-bearing claims TRUE: 9 files on merge tree; exports (createBlock/removeBlock/listBlocks/isBlockedBetween, CreateBlock/Block/BlockListResponseSchema, BlocksModule registered, DmModule imports BlocksModule, dm.service injects BlocksService + isBlockedBetween at :261/:599/:700); routes live (POST/GET /blocks → 401 not 404/500); migration applied (T-8 filed/read/HIDE/deleted real blocks); deploy hash a2c006a both services; integration real (19 live-DB cases), migration 0026 real (table+2FK+UNIQUE+index, 0 CREATE TYPE); 5 DM HIDE seams real (3 isBlockedBetween + 2 query-shaped, no N+1); findings honestly documented. Zero claimed-vs-actual gap.
## jenny (semantic-spec) APPROVE (2 non-blocking findings)
Launch-gate safety core CONFORMS FULLY: all block endpoints (self-block 400, exists 404, empty Zod 400, idempotent, IDOR-safe GET, DELETE 204) + ALL 5 DM HIDE seams BIDIRECTIONAL on prod (createConversation/sendMessage 403, candidates exclude, listConversations hide 1→0, listMessages 403), reversible on unblock. "Blocked user's DMs + content hidden" semantics genuinely hold. Spec-C own-row suppression + spec-D isSelf conform.
- FINDING-1 (MEDIUM spec-drift): MemberListPanel.tsx:546-566 hardcodes block-only, no isBlocked lookup → affordance doesn't toggle (spec-C AC specced state-reflection). Block still lands + reverse via settings + idempotent → UX not safety.
- FINDING-2 (MEDIUM spec-gap): blocked-list shows UUID (BlockedUsersPanel:265 falls back to blocked_id) — GET /blocks (spec A) never specced profile fields. Contract-seam gap; jenny: needs a spec-A contract change (richer GET /blocks) → P-block scope decision, NOT a V-3 fast-fix.
- Group-DM: P-4-anticipated gap; pending-DM-invite 403-guarded (sensible). 3-user group-block untested (only 2 prod fixtures).
jenny cleaned prod (deleted her block; A GET /blocks []).
```yaml
karen_verdict: APPROVE
karen_findings_count: 0
jenny_verdict: APPROVE
jenny_findings_count: 2
spec_drift_count: 1   # FINDING-1
spec_gap_count: 1     # FINDING-2
findings:
  - {ref: FINDING-1, severity: MEDIUM, type: spec-drift, desc: "member-row affordance doesn't toggle Block↔Unblock (MemberListPanel:546)"}
  - {ref: FINDING-2, severity: MEDIUM, type: spec-gap, desc: "blocked-list UUID not name; needs GET /blocks profile enrichment (contract change)"}
```
