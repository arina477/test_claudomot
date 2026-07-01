```yaml
verdict: REFRAME
verdict_source: problem-framer
matched_antipatterns: [8]
reasoning: |
  Claim 1 (displayName empty-fallback) is verified and correctly framed at the
  right layer: `??` only catches null/undefined, so `email.split('@')[0]` yielding
  '' (email starting with '@', or empty/malformed email) silently produces an empty
  displayName at both cited sites — a real latent correctness bug; fix is `||`.
  Claim 2 (ServerMembersResponseSchema) is verified to be genuinely UNUSED — zero
  consumers, controller + client both use the bare `ServerMember[]` array. The seed
  proposes to ALIGN the unused wrapper to the wire; that is backwards-compat-shim /
  dead-code churn (antipattern #8): aligning a schema nothing validates against adds
  a maintained artifact with no consumer. The right fix is to DELETE it, not reshape
  it. Both fixes are at the correct layer and are genuinely independent.
proposed_reframe: |
  Keep part 1 as framed; change part 2 from "align to wire" to "delete".

  PART 1 — displayName empty-string fallback (KEEP, verified real bug):
    - Root cause: `??` (nullish coalescing) does NOT catch '' (empty string), only
      null/undefined. `email.split('@')[0]` returns '' when email starts with '@'
      or is an empty/malformed string, so the chain yields an empty displayName
      instead of falling through to userId.
    - Site A: apps/api/src/presence/presence.gateway.ts:125
        `const displayName = userRow?.display_name ?? userRow?.email?.split('@')[0] ?? userId;`
    - Site B: apps/api/src/servers/servers.service.ts:249
        `displayName: r.displayName ?? r.email.split('@')[0] ?? r.userId,`
    - Fix shape: replace the middle `??` link with `||` so empty string falls through
      to the userId terminal (e.g. `?? (email?.split('@')[0] || userId)` or an
      explicit empty-check). `||` is correct here because the only falsy values in
      play ('' vs a non-empty prefix) both want the fallback; no legitimate empty
      displayName exists. Fix BOTH sites; behavior must be identical across them.
    - Note: display_name column may itself be '' if ever written empty — the same
      `??`→`||` change also guards a stored empty display_name, tightening both sites
      to one rule: any falsy displayName source falls through to userId.

  PART 2 — ServerMembersResponseSchema (REFRAME: delete, do not align):
    - Definition: packages/shared/src/servers.ts:66-68
        `export const ServerMembersResponseSchema = z.object({ members: z.array(ServerMemberSchema) });`
        `export type ServerMembersResponse = z.infer<typeof ServerMembersResponseSchema>;`
      Re-exported (barrel only) at packages/shared/src/index.ts:23 (schema) + :34 (type).
    - Wire shape is a BARE ARRAY, confirmed both ends:
        - apps/api/src/servers/servers.controller.ts:81 → `Promise<ServerMember[]>`
        - apps/api/src/servers/servers.service.ts:223 → returns `ServerMember[]`
        - apps/web/src/auth/api.ts:132 → `request<ServerMember[]>('/servers/${id}/members')`
      The wrapper `{ members: [...] }` matches nothing on the wire.
    - Usage grep: ZERO consumers of `ServerMembersResponseSchema` / `ServerMembersResponse`
      outside the definition file and the barrel re-export. Nothing validates against it,
      so "no live mismatch today" is confirmed — it is inert, not latent-dangerous.
    - Correct fix: DELETE the schema + type + both barrel re-export lines. Aligning an
      unused wrapper to the wire (`z.array(ServerMemberSchema)`) would leave a redundant
      alias of `z.array(ServerMemberSchema)` that still has no consumer — churn, not a
      trap removed. Deletion removes the "latent contract trap" entirely at lower cost.
      (If a future wave needs response validation, `z.array(ServerMemberSchema)` is
      trivially reconstructable inline at the call site then.)

  Symptom-vs-cause: both parts are cause-layer correctness/contract cleanups, not
  symptom patches. Part 1 fixes the operator (cause) not a downstream empty-name
  display glitch (symptom). Part 2 removes the dead artifact (cause) rather than
  papering over it. Both at the correct layer (part 1 in the two service/gateway
  fallback sites; part 2 in the shared package). Genuinely INDEPENDENT — different
  packages, different failure modes, no shared code path; not scope-creep coupling.
escalation_reason: |
  n/a
sibling_visible: false
```

## Framing detail (non-YAML)

**Symptom-vs-cause (mandatory check): PASS for both.** Neither part is a symptom
patch. Part 1 corrects the nullish-coalescing operator that is the direct cause of a
possible empty displayName; part 2 targets the dead schema itself.

**Antipattern match:** #8 (backwards-compat / dead-code shim) fires on part 2 ONLY.
The seed says "align the schema to the wire," but the schema has no consumer, so
alignment produces a maintained-but-unused alias. Delete-cleanly is the catalog
prescription. Part 1 matches no antipattern — it is a correct, right-layer, real-bug
fix and should proceed exactly as framed.

**PRODUCT-PRINCIPLES rule 1 + rule 2 (seed-claim verification):**
- Claim 1 named entities are the real targets: both `email.split('@')[0]` fallback
  sites exist at the cited layer and genuinely carry the `??`-misses-empty-string bug.
- Claim 2 named entity exists but the seed's PROPOSED FIX (align) targets the wrong
  disposition; the entity is confirmed unused, so delete is the real fix. The seed's
  factual premises ("declared but", "no live mismatch today") are both TRUE.

**Disposition:** REFRAME (minimal — part 1 unchanged, part 2 changes
"align" → "delete"). Re-spawn reviewers per P-0 Action 6 REFRAME row is the mechanical
consequence, but the reframe is narrow: the wave stays a two-item, non-blocking,
independent code-debt cleanup; only part 2's fix shape flips from reshape to remove.
