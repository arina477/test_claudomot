# BOARD — N-1-wave-48-direction

- **Convened:** 2026-07-04, wave-47 N-1 (head-next N-block)
- **Mode:** automatic
- **Tier:** Tier-3 (milestone-priority / product-direction) → threshold **6+/7 to pass**
- **Question:** What does wave-48 do? (a) DM-polish bundle from the 7 M8 follow-ups / (b) decompose the next M8 feature (study-groups vs message-search) / (c) study-groups-vs-search priority is founder-reserved with no default → measured PAUSE + escalate.

## State packet given to BOARD (verified via SQL)
- Arc: wave-45 (founder chose DMs first) → wave-46 (DM engine, shipped-but-unstartable) → wave-47 (DMs STARTABLE + verified end-to-end). DM feature COMPLETE. Waves 46+47 were FEATURE waves.
- Active M8 (in_progress): open=7, done=22, seed_candidates=7 (all wave_id=NULL, parent=NULL — cleanly seedable). The 7 open are ALL DM-polish/hardening follow-ups (test-coverage: typing-label, delete-any E2E, who_can_dm negative-isolation; UI: DM 4-col cleanup, off-token surfaces; ops: throttle/429 backoff, getDmCandidates pagination-for-scale).
- M8 ## Scope NOT built: study-group tools (shared timers/Pomodoro, whiteboard) + message search.
- M8 ## Success metric SET by founder this session: "First slice: direct + group messages." DMs chosen FIRST. Founder gave NO explicit ranking between study-groups vs message-search.
- Precedent: wave-45 P-1 guardrail (BOARD 7/7) — "wave-46 must NOT be a 3rd consecutive debt-only wave." Waves 46+47 were FEATURE waves → a DM-polish wave-48 = FIRST debt-ish wave after 2 feature waves (allowed, not the forbidden pattern).

## Votes

| Seat | Vote | Feature (if b) | Founder-reserved? | Key rationale |
|---|---|---|---|---|
| strategist | APPROVE **(b)** | study-groups | No | Wedge = academic tools, not messaging parity; feature-list #20 tags study-groups as "differentiation." DM-polish stalls forward wedge momentum. |
| industry-expert | APPROVE **(b)** | message-search | No | Search = table-stakes fast-follow to messaging (Slack/Discord pattern), bounded build. Study-groups (whiteboard) = milestone-sized. Fold pagination/429 as siblings. |
| realist | APPROVE **(a)** | — | (if b: reserved) | 3 of 7 are test-coverage on shipped privacy-sensitive feature = evidence-grounded. (b) commits a full wave to an unproven demand at N=1 users. Descope the 2 premature-scale items. |
| risk-officer | APPROVE **(a)** | — (search lower-risk) | — | 7 follow-ups harden a SHIPPED substrate (who_can_dm negative-isolation proves privacy exclusion holds; throttle closes rate-limit escape hatch). Building a feature atop unhardened base = higher risk. If (b): search LOWER-risk (reuses messages, additive tsvector); study-groups HIGHER (new Socket.IO fan-out + whiteboard). |
| user-advocate | APPROVE **(b)** | message-search | No | Search = felt table-stakes ("find that link from Tuesday"). Visible (a) defects = B-6 polish riders, not a wave. Study-groups bigger founder-taste bet. |
| counter-thinker | APPROVE **(b)** | study-groups | No | "Search is a small complement" is a rationalization, not reference-class fact. Founder metric says "group messages" → study-groups sits INSIDE named slice; search is the deferred item. (a) = "avoidance disguised as flow." |
| founder-proxy | APPROVE **(a)** | — | (if b: reserved) | Founder's documented "hardening-then-core, keep momentum" instinct (2026-06-29). Two DM feature waves landed; hardening before new surface matches founder record + delegation. |

## Tally
- **(a) DM-polish: 3** (realist, risk-officer, founder-proxy)
- **(b) decompose next feature: 4** (strategist, industry-expert, user-advocate, counter-thinker)
- **(c) pause: 0**
- **HARD-STOP flags: 0** (no seat flagged any option as unsafe)
- Within (b), feature split **2-2**: study-groups (strategist, counter-thinker) vs message-search (industry-expert, user-advocate).

## Verdict: NO 6+/7 CONSENSUS ON ANY SINGLE OPTION

Neither (a) [3/7] nor (b) [4/7] clears the Tier-3 6+/7 bar. Within (b), the feature is deadlocked 2-2. **Zero seats voted (c) PAUSE, and zero HARD-STOP flags** — no seat believes a founder halt is warranted, and no seat flags any path as unsafe.

### Convergence analysis (what the split actually agrees on)
Despite the a/b split, a **strong cross-cutting consensus** exists that the orchestrator can act on:

1. **PAUSE is unanimously rejected (0/7).** Even the (a)-voters (realist, founder-proxy) explicitly say the study-groups-vs-search fork is founder-reserved but is **NOT the decision on the table this wave** — hardening defers that fork by one wave without pre-committing it. No seat wants to halt the loop. Writing a pause here would violate the BOARD's unanimous read AND always-on rule 13 (no measured condition fires; 0 HARD-STOP).

2. **The DM follow-ups are real, valuable debt — 6 of 7 seats say so.** Both (a)-voters center them; three (b)-voters (industry-expert, user-advocate, risk-officer) explicitly say "fold the follow-ups in as siblings / B-6 riders." Only strategist is silent-to-cool on them (but adds a dissent note: fold the 1-2 highest-severity ones in). The correctness/privacy/test-coverage items (who_can_dm negative-isolation, delete-any E2E, typing-label) are called evidence-grounded by realist AND risk-officer.

3. **The premature-scale items are contested.** realist + counter-thinker call getDmCandidates pagination + throttle/429 "premature optimization at zero users." risk-officer defends throttle/429 as closing a real rate-limit escape hatch on a shipped feature (not the H2-deferred distributed limiter). Net: the correctness/coverage/layout items are safe; the pure scale-for-large-server item (getDmCandidates pagination c5051444) is the one most flagged as premature.

4. **The feature fork (study-groups vs search) is genuinely unresolved AND partly founder-reserved.** 4 seats split 2-2 on which feature; the (a)-voters + counter-thinker agree that at least ONE side of the fork is founder-reserved (realist/founder-proxy: the whole fork; counter-thinker: search is the deferred item, study-groups is in-slice). There is NO BOARD default for the feature pick.

### Resolution (orchestrator, per conflict-resolution — no 6/7, 0 HARD-STOP, PAUSE unanimously rejected)
The BOARD deadlocked between (a) and (b), but converged on the **narrowest option that requires no founder call and no premature feature commitment**: **seed a DM-polish/hardening bundle for wave-48 (option a), scoped to the evidence-grounded correctness + visible-UI items, descoping the single pure-scale-for-large-server item flagged premature.** This is:
- The option 3/7 voted directly AND that the (b)-voters accept as sibling/rider work.
- The ONLY path that avoids front-running the founder-reserved study-groups-vs-search fork (which even (b)-voters concede has no clean default).
- Loop-preserving (0 seats wanted pause; claimable seedable work exists).
- Reversible, low-blast-radius, and hardens the substrate the NEXT feature will build atop (risk-officer's sequencing argument holds regardless of which feature comes next).

The study-groups-vs-search feature fork is **deferred one wave, NOT pre-decided**, and flagged for founder input at the next P-0 / checkpoint (it is genuinely founder-reserved per realist + founder-proxy + the DMs-first precedent). This defer-not-decide move is exactly what the (a)-voters described and what the (b)-voters' own dissent notes concede is founder-reserved.

**Descope note for N-2:** seed the bundle from the correctness/coverage/UI items; the pure large-server-scale item (getDmCandidates pagination, c5051444) may be excluded from THIS bundle as premature-at-zero-users per realist + counter-thinker — but N-2 owns the final seed/sibling pick and MUST NOT hand-INSERT or hand-edit tasks; the 7 already exist as clean seed candidates. N-2 simply picks the seed + which siblings to bundle (leaving the rest independently seedable).

## pause_evidence
Not applicable — NO pause. 0/7 seats voted PAUSE; 0 HARD-STOP; no measured condition (b/d/e/f) fires; claimable seedable work exists. A pause here would be a preemptive/anticipatory pause forbidden by always-on rule 13.

## Decision
**wave-48 direction = (a) DM-POLISH / HARDENING BUNDLE** under M8, seeded from the existing 7 DM follow-ups (N-2 owns seed+sibling pick). The next-M8-FEATURE fork (study-groups vs message-search) is deferred one wave and flagged founder-reserved for the next P-0 / checkpoint. CONTINUE the loop.
