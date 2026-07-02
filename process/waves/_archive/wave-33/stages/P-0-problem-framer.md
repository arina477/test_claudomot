verdict: RESCOPE-AUTO-SPLIT
verdict_source: problem-framer
matched_antipatterns: [1, 5]
reasoning: |
  Symptom-vs-cause (mandatory): the seed proposes patching the 500-on-malformed-channelId at the two
  voice routes only. Grep proves the real cause is a MISSING project-wide param-validation convention,
  not a voice-specific bug — ZERO of ~30 UUID-typed @Param bindings across 7 controllers (servers, rbac,
  channel-override, messages, assignments, voice-participants, voice-token, attachments) use ParseUUIDPipe,
  and there is NO global ValidationPipe or cast-error->400 filter (only SupertokensExceptionFilter is
  registered in main.ts). Every UUID route param on the same DB-cast path 500s identically on malformed
  input. Fixing 2 routes is symptom-patch (antipattern #1) and guarantees whack-a-mole across the other 5
  controllers. Wrong-LAYER is NOT the issue — a route-param pipe is the correct boundary layer; the issue
  is wrong-SCOPE. The wave should frame around the convention (all UUID params), not the finding's 2 routes.
proposed_reframe: |
  Reframe from "add ParseUUIDPipe to the 2 voice routes" to "establish and apply a project-wide malformed-
  UUID-param -> 400 convention across all authenticated :id / :channelId / :messageId / :roleId / :userId /
  :serverId route params (7 controllers), so no boundary maps malformed input to a downstream 500." The
  finding's 2 voice routes become instances of the fix, not its boundary. P-3 owns the mechanism choice
  (reusable ParseUUIDPipe applied per-param vs. a global QueryFailedError-invalid-uuid -> BadRequestException
  filter) — do NOT prescribe implementation here. Keep the credential-independent unit test per route family;
  add regression coverage for at least one non-voice controller to prove the convention, not just the patch.
escalation_reason: |
  (n/a)
sibling_visible: false
