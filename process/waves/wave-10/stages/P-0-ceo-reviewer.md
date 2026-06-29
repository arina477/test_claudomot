```yaml
verdict: PROCEED
verdict_source: ceo-reviewer
mode_applied: HOLD-SCOPE
mode_rationale: |
  This wave is the access-control capstone that closes M2's last unmet success-metric clause
  ("members join and see the right channels per role"). The scope is neither timid nor grandiose
  — it is a near-1:1 match to M2's already-locked `## Scope` RBAC clause, and the architecture
  was deliberately constrained to single-role-per-member (no join tables, no custom-role-builder,
  no granular per-permission matrix) at v6b. SCOPE-EXPANSION is wrong: bolting on a custom-role
  builder or org-wide permission matrix would be gold-plating for a self-use-mvp with 0 users and
  would not move the bet faster. SCOPE-REDUCTION is wrong: the four tasks are each load-bearing —
  drop any one and "channels per role" either doesn't ship (no can()/overrides) or ships unsafe
  (no owner-lockout) or ships unusable (no role UI). The bar here is execution rigor (authz
  correctness), not scope change. Hence HOLD-SCOPE.
bet_traced_to: "Academic tools + offline-first win students from Discord"
milestone_traced_to: "41e61975-c92e-49b1-9ae5-45498dd04925 — M2 Servers, channels & membership (in_progress)"
proposed_scope_change: |
  None. Scope held as authored.
drop_rationale: |
  n/a
escalation_reason: |
  n/a
sibling_visible: false
```

## Reasoning (full)

### Is it worth doing? Yes — it closes the milestone, not a vanity feature.
M2's `## Success metric` reads: "Organizer creates a study server with channels, invites the
cohort via link, and members join **and see the right channels per role.**" Waves 7/8/9 shipped
servers, channels, invites, and join — every clause EXCEPT the last. RBAC is the single remaining
piece that flips M2 from "mostly shipped" to "closeable." It is not a real-bug-that-doesn't-matter;
it is the gating capability that lets M2 → done → M3. The founder bet ("a study-server container
the wedge lives in") names the server as the vessel for the whole differentiator; a server where
organizers can't control who sees what is not a credible Discord substitute — Discord's
roles/permissions are table-stakes for any multi-user server, and study cohorts specifically need
an organizer/member distinction plus channel gating (e.g., a private #instructors or graded
#assignments channel).

### Is it ambitious enough — or too ambitious? Exactly right. (This is the question the task asks.)
The concern raised — "would a SIMPLER role model suffice for an MVP" — was already answered upstream
and the planned scope IS the simpler model. The architecture was deliberately thinned at v6b
(product-decisions, cross-branch resolution #3): **single-role-per-member** via
`server_members.role_id`, **no join tables**. There is no custom-role builder, no org-wide
per-permission matrix, no role hierarchy/inheritance in scope — those are the gold-plating traps a
0-user MVP must avoid, and they are correctly absent. What remains is the irreducible minimum for
"channels per role":
- **RbacModule + can()** (35f191f4) — without server-side `can()`, there is no enforcement at all.
- **channel_permission_overrides + guard** (2c927c44) — this IS the "see the right channels per
  role" mechanism; it is the success metric, not an add-on.
- **owner-lockout safeguard** (7a10f13d) — the cheapest possible invariant (last-owner can't
  demote/remove themselves); omitting it ships a foot-gun that bricks a server. Not optional.
- **role-management UI** (0b9bcf35) — without it the capability is real but unreachable by the
  organizer persona; the metric is observable only through this surface.

Cutting any of the four does not produce "the same outcome faster" — it produces a different,
lesser outcome (unenforced, unsafe, or unusable). That is the test for SCOPE-REDUCTION, and it
fails. ~3000–3800 LOC being the biggest M2 wave is proportionate: it is authz-critical code (every
path must re-derive authorization server-side per the security note), four cooperating surfaces
(table + service + guard + UI), and the capstone of a foundation milestone. Size tracks
intrinsic complexity, not ambition inflation.

### Sequencing: RBAC before M3 messaging — correct.
M3 (Real-time messaging) is the next milestone (`todo`). Messaging happens *inside channels*; if
channel visibility is not role-gated before messages flow, then either (a) M3 ships messaging into
ungated channels and RBAC retrofits visibility onto an already-live message surface (rework +
a window where private-channel messages were readable by all), or (b) M3 is blocked anyway. Doing
RBAC last in M2, immediately before M3, is the correct order: visibility rules must exist before
the content they gate. M2's `## Required by` field confirms M3/M4/M5/M6 all depend on this
foundation. Sequencing is sound.

### One execution note (carry-forward, not a scope change)
This wave is authz-critical. The HOLD-SCOPE verdict is contingent on T-8 Security rigor downstream:
every decision must re-derive identity/authorization server-side via `RbacService.can()` from
route-param-only context (never client-supplied role/permission/server-id trust), and the
owner-lockout invariant must be enforced at the service layer, not the UI. This is already flagged
in the N-1 bundle security note and the standing wave-8/9 carry-forwards; it belongs to P-2/T-8
discipline, not to P-0 scope. No ambition or scope change is warranted.

**Disposition: PROCEED (mode: HOLD-SCOPE).**
