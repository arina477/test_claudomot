# P-0 — ceo-reviewer verdict (wave-12)

```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  The scope is exactly right and the bar here is execution quality, not scope
  arbitration. Real-time messaging is the conversational core named verbatim in
  the live bet's product description and H1 horizon — without it M1/M2's servers
  and channels are empty rooms, so this is unambiguously the right next build.
  The bundle is also correctly thinned: it cuts the foundational text data plane
  (REST send/list + Socket.IO real-time + composer/list UI) and explicitly defers
  reactions/threads/mentions/attachments/presence/member-list to later M3 waves.
  Not SCOPE-REDUCTION because the included scope is already the minimum slice that
  ships the success metric — there is nothing grandiose to strip. Not
  SCOPE-EXPANSION / SELECTIVE-EXPANSION because the deferred features are real M3
  scope but none is cheap-but-disproportionate enough to pull forward without
  bloating a first messaging wave (WIP-limit discipline); they earn their own
  waves. Not DROP — this is the highest-value milestone the roadmap has.
bet_traced_to: Academic tools + offline-first win students from Discord
milestone_traced_to: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 — M3 — Real-time messaging
proposed_scope_change: |
  None. HOLD-SCOPE.
sibling_visible: false
```

## Reasoning (the four judge questions)

### 1. Strategic value — is real-time messaging the right next build?
Yes, unambiguously. The live bet's `## Statement` lists the product as "group servers,
text channels, **real-time messaging**, voice/video calls" and its `## Horizon` defines
H1 as "desktop MVP (group servers, text channels, **real-time messaging**) usable by one
class cohort." The North Star is "weekly active students in study servers" — students do
not become weekly-active in empty rooms. M1 (foundation/auth/profiles) and M2
(servers/channels/invites/RBAC) are live but they build the *container*; messaging is the
*content*. This is the last major piece of the Discord-for-coursework heart and the
single highest-leverage thing the roadmap can ship right now. The wave-12 bundle delivers
the exact M3 success-metric core: "two students exchange messages in real time (<1s)."

### 2. Ambition / sizing — real-time-from-the-start vs. a thinner REST-poll MVP?
Real-time is essential, not gold-plating. The M3 success metric is *defined* as
"<1s delivery" — a REST-poll MVP cannot meet that bar and would be re-architected away,
which is wasted work, not a smaller slice. The bundle is also correctly sequenced as its
own internal slice: the seed (a0c322b4) is the schema/contract foundation (`messages`
table + shared type + idempotency-key dedup + cursor pagination); the two siblings
(723b5b6a Socket.IO gateway, d999d29c UI) build on it and not on each other. ~3200 LOC for
REST + WS + UI is right-sized for a first messaging slice — it is the data plane plus the
minimum surface to observe it, nothing more. This is not "shipping a 9/10 when a 3/10 was
enough" (the real-time requirement is load-bearing on the metric) and not "shipping a 3/10
when a 9/10 was achievable" (the deferred richer features are genuinely separable).

### 3. Gold-plating vs. too thin?
Correctly thinned, not too thin. Reactions, thread replies, mentions, file/image
attachments, presence/typing, and the presence-aware member list are all real M3 `## Scope`
items — and all correctly deferred to subsequent M3 waves to keep this wave WIP-limited and
avoid bundle bloat. Deferring them does not break the milestone's mvp-critical claim: a
cohort can hold a real conversation with send/list/real-time alone. None of the deferred
items clears the cheap-but-disproportionate bar that would justify pulling one forward
(each carries its own table/namespace/UI surface). The included scope is the irreducible
core; the excluded scope is honest follow-on. No expansion, no reduction warranted.

### 4. Sequencing — messaging after the full server/channel/RBAC structure?
Correct. Messages flow *into* channels and must be access-controlled per role, so channels
+ membership + RBAC (M2, all live) are genuine prerequisites — this wave reuses M2's
wave-10 `ChannelPermissionGuard` and SuperTokens/RBAC auth primitives directly rather than
re-inventing authz. Downstream sequencing is also right: M3's `## Required by` states
"M4 (offline builds on the messaging path)," and M4 (offline-first reliability) is the
founder's named differentiator/wedge and the very next planned milestone. So this messaging
data plane is squarely on the critical path to the moat — building it now de-risks M4.

## Disposition
PROCEED at the proposed scope. Execution-quality bar (already flagged in the bundle's
security note and inherited at P-2/T-8): live-probe authz through ChannelPermissionGuard on
send/list/WS-upgrade/room-join with the verified prod fixture; idempotency on
`UNIQUE(channel_id, idempotency_key)`; cursor-only pagination; WS auth on upgrade (not first
message); mandatory two-client real-time verification of the <1s metric. These are
HOLD-SCOPE rigor items, not scope changes.
```
