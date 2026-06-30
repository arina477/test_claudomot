# Wave 14 — P-0 Frame

## Discover
- **wave_db_id:** f46bfdf0-e2df-44d4-8a1e-04792b00ab2a (wave_number 14)
- **Prior-work:** wave-12/13 built /messaging Socket.IO gateway + WS-upgrade auth (SuperTokens cookie, task 723b5b6a) + room-per-channel fan-out + ChannelMessageGuard. This wave REUSES that auth path + gateway infra for a new /presence namespace. Message lifecycle (send/list/edit/delete/reactions) LIVE.
- **Roadmap milestone:** M3 Real-time messaging (6198650e) in_progress; Class=product-feature, Tier=T2, Horizon=H1. Wave-14 milestone backfilled. Maps 1:1 to M3 ## Scope clause "presence + typing (/presence namespace), member list with presence."
- **Spec-contract short-circuit:** no-prior-spec (seed prose ## What/Why/Acceptance, no fenced YAML head) → full P-1..P-3.
- **Product decisions:** none Tier-3. Presence WS-auth + membership-scoped fan-out = standard security-tightened path → flagged for T-8 + P-4 security-tightened gate (no founder ask; applied silently).

## Reframe
- **Original framing:** M3 presence layer — /presence namespace (online/offline, multi-tab ref-count, membership-scoped fan-out, snapshot-on-join) + typing + member-list panel + author-row presence dots (4 tasks).
- **problem-framer:** PROCEED. Cause-layer primitive at correct layer; multi-tab ref-counting correctly-sized (not gold-plating); demo-paths enumerated (no tunnel vision); RESCOPE-AUTO-SPLIT considered + rejected (4 tasks one coherent slice; member-list is the seed's consumer surface).
- **ceo-reviewer:** PROCEED / HOLD-SCOPE. Traces 1:1 to live displace-Discord bet + M3 scope. Right ambition: idle/away + rich-presence correctly OUT; in-house realtime (locked /messaging + /presence namespaces) fits the bet. No expansion.
- **mvp-thinner:** THIN — split author-row presence dots (10b9d18e). Trace test: dots are a SECOND rendering of presence the member-list already exposes; pure polish, metric satisfiable without it. Floor check: cutting dots leaves ~2650 LOC / 3 specs (above multi-spec floor); cutting typing too would drop below floor (refused). Member-list + typing KEEP (presence with no surface is invisible).
- **Mediation (problem-framer coherent-slice vs mvp-thinner THIN):** RECONCILABLE, not a conflict. problem-framer argued against splitting typing+dots TOGETHER (would strand the seed). mvp-thinner keeps member-list (the consumer surface) + typing, defers ONLY the redundant author-row dots. Both agree member-list must ship with the seed. Accepted mvp-thinner THIN: the deferred dots consume the same client presence store the member-list builds → near-zero future rework; no stranding (member-list is the visible consumer). Precedence: mvp-thinner wins (M3 has open mvp-critical scope; dots are additive polish, not mvp-critical).
- **Disposition:** PROCEED (narrowed). author-row dots (10b9d18e) deferred — remains a parked M3 sibling todo (wave_id NULL), NOT claimed this wave. No new INSERT (task already exists).
- **Final framing:** Wave-14 ships the real-time presence layer: /presence namespace (online/offline) + typing indicators + member-list panel with live presence. claimed_task_ids = [d1c4693d, 58633934, 058984c5]. 10b9d18e (author-row dots) deferred to a later M3 wave.
