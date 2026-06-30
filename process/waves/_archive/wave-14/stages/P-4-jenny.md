# P-4 Phase-2 — jenny spec-vs-roadmap drift check (wave-14, M3 presence layer)

**Verdict: APPROVE** — spec maps 1:1 to M3 `## Scope`; no drift, no creep, no decision conflict. Honors the locked 2-namespace realtime architecture. Presence correctly does NOT claim to close M3.

## Inputs verified (this turn)
- Spec contract: task `d1c4693d` YAML head + 2 siblings (`58633934` typing, `058984c5` member-list) — read from `tasks.description` (DB, canonical).
- M3 milestone prose: `milestones/6198650e` `## Scope` + `## Success metric`.
- Journey map: `command-center/artifacts/user-journey-map.md` L31, L80, L82–83, L135.
- Product decisions: `command-center/product/product-decisions.md` (v6b L36 #8 "2 Socket.IO namespaces"; M3 bundle log L196–204).
- P-0 frame: `process/waves/wave-14/stages/P-0-frame.md`.

## Item-by-item

**1. 3-block spec ↔ M3 `## Scope` clause — MATCHES (1:1).**
M3 `## Scope` reads "...presence + typing (/presence namespace), member list with presence." The three claimed specs are an exact decomposition: (a) `d1c4693d` = `/presence` namespace online/offline; (b) `58633934` = typing over `/presence`; (c) `058984c5` = member-list with presence. No clause of the scope phrase is unmapped; no spec block falls outside it. P-0 L6 already asserts the same 1:1 mapping.

**2. Deferring author-row presence dots (`10b9d18e`) ↔ prior decisions / journey map — NO CONFLICT.**
- Journey map L31 lists "presence" as a page-9 (server-channel-view) capability but specifies no author-row-dot surface; the member-list panel (`058984c5`) is the visible presence consumer, satisfying the journey "presence" entry. Deferring the *second* rendering (author-row dots) leaves zero journey-map surface unmet.
- No product-decision locks author-row dots. The mvp-thinner THIN call (P-0 L14–17) is internally coherent: dots are a redundant second read of the same client presence store the member-list builds → near-zero future rework, no stranding.
- Design decision L58 mentions "member presence (online / in voice)" at the panel level — consistent with the panel shipping; dots are additive polish, not a named must-have.

**3. Realtime-architecture lock ("exactly 2 namespaces /messaging + /presence") — HONORED.**
product-decisions L36 resolution #8: "2 Socket.IO namespaces (`/messaging`, `/presence`)." Seed `d1c4693d` introduces `/presence` (the second, already-budgeted namespace) — NOT a third. Spec explicitly reuses the `/messaging` WS-upgrade auth path (task `723b5b6a`), no new auth surface. Typing rides the *same* `/presence` namespace (no `/typing`). Fully compliant; this is the architecture the lock anticipated.

**4. Scope creep beyond M3 — NONE.**
Spec covers only online/offline + typing + member-list. Idle/away and rich-presence are explicitly OUT (P-0 L13 ceo-reviewer HOLD-SCOPE; not present in any AC). No DMs (the `058984c5` member-list is server-membership-scoped via existing `GET /servers/:id` data, no DM model). No new table (in-memory ref-count map; membership from existing `server_members`). Edge-cases are correctness boundaries (multi-tab ref-count, abrupt disconnect, scoping), not feature expansion.

**5. Presence does NOT over-claim M3 closure — CORRECT.**
M3 `## Success metric` = "two students exchange messages in real time (<1s), with reactions, threads, and attachments working." Realtime messaging + reactions are LIVE (waves 11–13); the metric's **threads, mentions, attachments** clauses remain unshipped. Neither the spec, P-0 frame (L17: "Threads/mentions/attachments remain later-M3"), nor the bundle log claims this wave closes M3. Presence/typing/member-list are a Discord-core conversational primitive that *follows* the message lifecycle — correctly additive, not terminal for the milestone.

## Security carry-forward (noted, not a drift)
Spec + milestone prose both require membership-scoped fan-out (no presence/typing leak to non-co-members) and SuperTokens WS-upgrade auth — correctly flagged for T-8 + the P-4 security-tightened gate (P-0 L8). Two-client realtime verification mandatory per the wave-11/12/13 precedent (journey L135). This is the established authed-realtime path, applied silently — no founder ask, consistent with rule 17.

## Conclusion
**APPROVE.** Zero drift between the 3-block spec and the M3 roadmap. The single deferral (author-row dots) is a sanctioned mvp-thinner THIN with no conflicting decision or journey surface, no stranding, near-zero rework. Architecture lock honored (2nd of 2 budgeted namespaces; auth reused). No creep. Milestone-closure claim correctly withheld (threads/mentions/attachments remain).
