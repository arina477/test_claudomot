# P-4 Phase-2 — Spec-drift check (jenny) — wave-70 (M14 Block feature)

**Scope:** Cross-reference the 4-block Block spec (`bc5986a9…` + siblings) + P-3 plan against the
`user-journey-map.md` (DM / privacy / settings / report journeys) + `product-decisions.md` (prior
DM / privacy / moderation / block decisions). Distinguish **spec-drift** (contradicts a settled
prior decision) from **spec-gap** (an unhandled case the journey implies).

**VERDICT: APPROVE** — the Block spec aligns with every touched journey and prior decision. No
spec-drift found. Two minor spec-gaps noted for P-2 (neither blocks; both are within the milestone's
documented deferral fence).

Evidence base: DM journey (`user-journey-map.md:368-375`), privacy panel (`:350-365`), wave-69
moderation/own-content-leak (`:415-420`), wave-68 Overview settings shell (`:394-413`); live source
`apps/api/src/dm/dm.service.ts` (who_can_dm enforcement at :144/:240), `apps/web/src/shell/MemberListPanel.tsx`
(no self-guard today), `packages/shared/src/privacy.ts` (WHO_CAN_DM contract); prior decisions
`product-decisions.md:7-12` (M14 first bundle — user-to-user block explicitly deferred to this bundle),
`:16-22` (wave-68 M11 close — moderation launch-gate carry).

---

## Item 1 — DM HIDE behavior vs the existing DM journey + the BETA "Who can message you?" panel

**MATCHES (both sub-questions).**

### 1a. HIDE predicate vs createConversation / sendMessage / candidates / list — MATCHES
The spec layers the block filter on exactly the 5 DmService seams the journey already inventories
(`user-journey-map.md:371`: `POST /dm/conversations`, `POST …/messages`, `GET /dm/conversations`,
`GET …/messages`, `GET /dm/candidates`). Spec A AC-5 (`bc5986a9…`) maps 1:1:
- createConversation → reject either-direction block (matches the existing `who_can_dm`-enforced
  pre-write gate idiom at `dm.service.ts:201/237-240` — same seam, additive predicate);
- sendMessage → reject (participant-gated path at `:494`);
- getDmCandidates → exclude (the wave-47 candidate-privacy fence at `:685-717` already filters
  `who_can_dm≠'nobody'` + self — adding an either-direction block exclusion is the *same kind* of
  WHERE-clause fence, not a new mechanism);
- listConversations / listMessages → hide (participant-scoped reads at `:382` / `:576`).

No prior DM decision is contradicted. The wave-45 founder direction ("DMs first", `product-decisions.md:36-39`)
and the wave-46/47 DM journey established DMs as the surface; Block *hardens* that surface without
re-architecting it. The plan's explicit "do NOT build a second permission system; reuse the DM-visibility
idiom via a shared `isBlockedBetween(a,b)` helper" (P-3 plan L6) is exactly the reuse posture the
wave-69 moderation slice was praised for (`product-decisions.md:9`, "adds no second permission system").

### 1b. Block vs the BETA "Who can message you?" privacy panel — ORTHOGONAL (not a conflict / not a duplicate)
The journey (`:355`) describes a **disabled BETA who-can-DM affordance** on `/settings/privacy`
(`aria-disabled`, 0 enabled inputs). Verified against live source: this is **only the settings *toggle* UI**
that is disabled. The underlying `who_can_dm` policy is **already live and enforced server-side** —
`enforceWhoCanDm` (`dm.service.ts:144`, called at `:240`) and the candidate filter (`:717`
`ne(users.who_can_dm, 'nobody')`); the shared contract carries it as a live non-optional field
(`packages/shared/src/privacy.ts`: `WHO_CAN_DM`, `PrivacySettingsResponseSchema.whoCanDm`).

The two mechanisms are genuinely **orthogonal**, exactly as the prompt framed:
- **who_can_dm** = the *recipient's who-can-INITIATE policy* — a coarse, one-directional, policy-valued
  gate (`everyone | server-members | nobody`) checked only at conversation *creation*. It is the
  target's standing preference, not a per-actor relation.
- **Block** = a *user-level, per-pair, bidirectional HARD hide* — A blocks B ⇒ neither can create,
  send, see candidates, or see existing conversations, everywhere, cross-server. It is an explicit
  actor-to-actor relation with its own table.

They coexist without collision: who_can_dm can pass (target allows `everyone`) while a block still
hides (A blocked B). The spec correctly gives Block its own `user_blocks` table + its own predicate
rather than overloading the `who_can_dm` enum — overloading would have been the drift. **No conflict,
no duplication.** (Note the BETA panel being surfaced-but-disabled is a *pre-existing* UI-honesty
state, not something this wave must un-disable — Block ships its own settings list per spec C, item 2.)

---

## Item 2 — "Blocked users" settings list vs the existing settings surface

**MATCHES.**

Spec C AC-2 (`6e4d56b2…`) reuses "the existing settings surface idiom, e.g. the wave-68 Overview
settings shell / member-list component." The journey inventories two compatible idioms:
- the **wave-68 Server Settings — Overview** shell (`:394-397`): full-screen `role=dialog`, left nav
  rail, cards, per-row controls — the settings-dialog pattern the spec names;
- the **wave-35 User settings — privacy** surface (`:350-365`, `/settings/privacy`) — the *user-scoped*
  settings home where an account-level "Blocked users" list most naturally belongs (blocks are
  cross-server / user-level, not server-scoped — see item 4), and which already hosts the (disabled)
  who-can-DM affordance, making it the topically-correct neighbor.

The list-of-rows-with-inline-action + loading/empty/list states (spec C AC-2) mirror the wave-69
owner report **inbox** idiom (`:417`: "loading (skeleton rows) / list / empty / actioning / error")
and the member-list row idiom. No contradiction with any settings-surface decision. **Minor P-2 note
(non-blocking):** the spec offers the Overview *server-settings* shell as the example, but a
user-level block list fits the **user**-settings home (`/settings/privacy`) better than a
*server*-scoped Overview dialog. Not drift — the spec says "e.g." and the idiom (dialog/list/rows)
is what must be reused, not the specific host. Flag for P-2 to pin the exact host surface.

---

## Item 3 — Member-row fix (spec D) vs the wave-69 report-affordance journey

**MATCHES — and it is the exact residual leg of the wave-69 own-content-leak fix.**

Verified against live source + git history:
- The wave-69 fast-fix (`b1ff064`, "own-content report leak + mobile inbox") fixed the leak **for
  messages** — `MainColumn.tsx:343` now passes `currentUserId={profile?.userId ?? null}` (the userId,
  not username), so the message-row `isOwn` gate works (journey F1, `:416`).
- But `MemberListPanel.tsx` still renders `onReport` on **every** member row unconditionally
  (`:428` no `selfUserId` prop; `:520-521` Report button on each `member.userId` with no `isSelf`
  guard). So Report still shows on the viewer's OWN member row.

Spec D (`cc783559…`) targets exactly this residual: thread `profile.userId` (a UUID) into
MemberListPanel + add `isSelf` guard in MemberItem, "mirroring the message-row isOwn gate." This is
**consistent with**, not contradictory to, the wave-69 fix — it completes the same own-content-leak
remediation on the member surface that landed for the message surface. The spec's "Non-security
(backend already derives reporter_id from session)" caveat matches the wave-69 finding classification
("F1 MAJOR … non-security", `:416`). Fully aligned.

---

## Item 4 — Cross-server + bidirectional block semantics vs how DMs / servers are modeled

**MATCHES.**

The journey models DMs as **cross-server / not server-scoped**: the wave-47 completion made DMs
STARTABLE via `GET /dm/candidates` precisely by *removing* the serverId gate ("StartDmPicker rewired
from `GET /servers/:id/members` (serverId-gated → dead-end) to `GET /dm/candidates` (no serverId
gate)", `:369`). DMs live on "a distinct non-server destination" in the app shell (`:370`).

The spec's model matches this exactly:
- **Cross-server:** `user_blocks` has NO `server_id` (spec A AC-1 + edge-case "block is cross-server —
  a block set in server X hides DMs everywhere"; P-3 plan L5/L10). A user-level DM-reachability relation
  correctly lives at the same (server-agnostic) scope as DMs themselves. This is the *right* call —
  a server-scoped block would contradict the cross-server DM model.
- **Bidirectional:** spec A AC-5 + edge-cases make the HIDE predicate either-direction for DM
  reachability (A blocks B ⇒ neither can DM the other). Consistent with the DM journey's symmetric
  1:1 relation (`:372` "bidirectional (A↔B)" candidate fence already exists) and the standard
  Discord/Slack prior-art the project has consistently anchored to.

The wave-41 server-scoped ModerationService (member-timeout) is correctly *not* reused for this —
the P-3 plan L5 explicitly distinguishes it as "server-scoped member-timeout, semantically distinct
from a cross-server user block." No modeling contradiction.

---

## Item 5 — Spec-gaps (unhandled cases the journey implies)

Two minor **spec-gaps** (NOT drift). Per the APPROVE rubric, minor gaps are noted for P-2 without
blocking. Both fall inside the M14 deferral fence already logged (`product-decisions.md:9`,
`user-journey-map.md:375`), so their absence is defensible.

**Gap 5a — Group DMs (≤10) when a block lands.** The journey confirms group DMs EXIST:
`POST /dm/conversations` supports "cap ≤10 … Create Group (≤10)" (`:371-372`). The Block spec's HIDE
predicate is written in **1:1 pairwise** terms (createConversation gate, either-direction pair check)
and does not state what happens to an *existing group DM* that contains both blocker and blocked, nor
whether a block prevents adding a blocked user to a new group. The spec's edge-cases enumerate the
1:1 convo case only. **P-2 note:** decide the group-DM semantics explicitly — likeliest MVP answer
(matching the "hard hide, don't break others" posture): a block does NOT dissolve a multi-party group
for the other N−2 participants, but hides the blocked counterpart's messages from the blocker within
it and blocks *creating* a new group that pairs the two. This is a genuine gap because group DMs are
LIVE, not deferred. Low severity (group DMs are low-traffic at self-use-MVP; no data), but it should
be named so B-block doesn't silently pick a behavior.

**Gap 5b — Pending DM invite / restricted-target create at block time.** The journey notes a
"restricted-target create returns 403 shown inline" path (`:372`) and find-or-create 1:1 dedup. The
spec covers "blocked user attempts to open/continue a DM → 403" but does not state whether a block
should *retroactively* affect an in-flight/optimistic-pending outbound message (the offline outbox,
`:371` "offline-tolerant send via generalized outbox") that was queued before the block landed.
**P-2 note:** specify that a pending outbound message to a now-blocked user fails gracefully on drain
(the client "does not error on a now-hidden conversation" per spec C AC-3 already covers the *read*
side; the *outbox drain* side should be named). Very low severity — offline-outbox + fresh-block race
is a corner of a corner; acceptable to defer, but worth one line.

Neither gap touches the launch-gate core (the either-direction 1:1 HIDE predicate + block/unblock/list
endpoints), all of which are fully specified. Group-DM block admin + advanced block edge-handling are
consistent with the journey's own deferral list ("group-DM admin … per-user block/report" as later
M8/M14 slices, `:375`).

---

## Summary table

| # | Item | Result | Conflicting prior decision? |
|---|------|--------|------------------------------|
| 1a | DM HIDE vs DM journey (5 seams) | **MATCHES** | none |
| 1b | Block vs BETA who_can_dm panel | **MATCHES (orthogonal)** | none — block=hard pairwise hide; who_can_dm=one-way initiate policy; live-enforced, not a stub |
| 2 | Blocked-users list vs settings surface | **MATCHES** | none (minor: pin user-settings host not server Overview) |
| 3 | Member-row fix (spec D) vs wave-69 report journey | **MATCHES** | none — completes the wave-69 own-content-leak fix on the member surface |
| 4 | Cross-server + bidirectional vs DM/server model | **MATCHES** | none — DMs are cross-server (wave-47); block scope matches |
| 5 | Spec-gaps | 2 minor GAPS (non-blocking) | 5a group-DM block semantics; 5b pending-outbox drain at block time |

**Final verdict: APPROVE.** No spec-drift against any settled DM / privacy / moderation / settings
decision. Two minor spec-gaps (group-DM block semantics; pending-outbox drain race) forwarded to P-2
to pin explicitly — neither blocks the wave; both sit inside the documented M14 deferral fence.
