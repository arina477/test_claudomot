# Monitor Template — Railway Deploy

Copy into your `MONITOR:` task's `description` MONITOR YAML carve-out per [`claudomat-brain/db/SCHEMA.md`](../db/SCHEMA.md) § tasks. Spawn via the `MONITOR — upsert (railway)` recipe in [`claudomat-brain/db/SCHEMA.md`](../db/SCHEMA.md). Adjust `$RAILWAY_SERVICE` to your project's service name.

READ `claudomat-brain/monitors/monitor-principles.md` first — this template is a pre-filled instance of the three-condition contract.

## Project-token vs account/workspace-token — never read "no access" from `whoami`

A Railway credential comes in two flavors, and they expose **different** CLI surfaces:

- **Account / workspace token** — identifies a user or workspace. Answers `railway whoami`, lists every project via `railway list`, and supports account-flavored `railway status`.
- **Project token** (the bring-your-own case the founder pastes) — scoped to ONE project. `railway whoami` may print "Unauthorized" or empty, `railway list` may fail, and account-flavored `railway status` may error — **even though the token deploys that project perfectly.**

**Do NOT conclude "no Railway access" from `railway whoami` / `railway list` / account-flavored `railway status` failing.** Those probe the account surface, not the deploy surface. A failing `whoami` on a project token is expected, not a credential problem.

**Verify with a deploy-scoped command instead.** Run a call that exercises the actual deploy surface and treat the credential as usable when it succeeds:

```bash
# Deploy-scoped probe — succeeds on a valid project token even when `whoami` does not.
# `railway deployment list` is genuinely deploy-scoped and project-token-friendly: it really
# has `-s/--service` and `--json` (unlike `railway status`, which takes ONLY `--json` and has
# NO top-level `deployments` key). Success criterion = exit 0 with a valid JSON array (the
# token reached the deploy API). Do NOT require the array to be non-empty — an empty array
# (a valid just-pasted token against a service with no deployment yet) still means the token
# is usable; requiring deployments would wrongly read that as "no access".
railway deployment list --json --service "$RAILWAY_SERVICE" \
  | jq -e 'type == "array"'              # exit 0 + valid JSON array ⇒ token reached the deploy API (empty array is still usable)
# Before any project/service exists, presence of the token in the environment is the signal:
#   [ -n "$RAILWAY_TOKEN" ] || [ -n "$RAILWAY_API_TOKEN" ]
```

Only when **no** Railway token is in the environment at all should the brain treat the credential as absent (and route to C-2 Action 0's bring-your-own founder-ask pause). This same rule governs C-2 Action 0's credential probe.

**Env-var presence is provisional, not proof of validity.** Before any project/service exists, an exported `RAILWAY_TOKEN` / `RAILWAY_API_TOKEN` is only an "attempt" signal — the token may be stale, expired, or revoked. If the **first real deploy-scoped Railway call** during provisioning then fails with an **auth / unauthorized** error (as distinct from a "no project / service yet" error), treat it as **credential-absent** and route back to C-2 Action 0's founder-ask pause so the founder can mint a fresh token — do NOT report it as a hard deploy failure.

## Conditions

```yaml
platform: railway
success_condition: |
  railway deployment list --json --service "$RAILWAY_SERVICE" \
    | jq -e '.[0].status == "SUCCESS"'

failure_condition: |
  railway deployment list --json --service "$RAILWAY_SERVICE" \
    | jq -e '.[0].status | IN("FAILED", "CRASHED", "REMOVED", "SKIPPED")'

timeout_budget: 900   # 15 minutes. Typical Railway deploy is 2-5 min; pad for queue time.
poll_delay: 45        # seconds between polls
```

## Railway deployment states

Reference: `railway deployment list --json` (a bare array; the latest deployment is `.[0]`). Known states for `.[0].status`:

| State | Terminal? | Classify as |
|---|---|---|
| `QUEUED` | no | pending |
| `INITIALIZING` | no | pending |
| `BUILDING` | no | pending |
| `DEPLOYING` | no | pending |
| `SUCCESS` | yes | success |
| `FAILED` | yes | failure |
| `CRASHED` | yes | failure |
| `REMOVED` | yes | failure (deploy was removed before completion) |
| `SKIPPED` | yes | failure (Railway deprioritized the build — code did NOT ship) |

**SKIPPED is a failure, not a success.** Railway did not deploy this commit even though CI passed. Treating SKIPPED as success is how "green CI, but no deploy" incidents happen.

Verify this list against actual `railway deployment list --json` output before relying on it — Railway occasionally adds or renames states.

## MCP fallback

If `railway` CLI is not installed in the environment:

```yaml
success_condition: |
  echo "Use mcp__Railway__list-deployments and check .deployments[0].status == SUCCESS"
failure_condition: |
  echo "Use mcp__Railway__list-deployments and check .deployments[0].status in (FAILED,CRASHED,REMOVED,SKIPPED)"
```

The monitor logic should wrap the MCP call in a shell script that converts MCP output to exit codes.

## On failure — triage task contents

When the monitor marks FAILURE, the created triage task MUST include:

- Last 100 lines of `railway logs --service "$RAILWAY_SERVICE" --deployment-id <id>`
- The commit SHA that was deployed (`git rev-parse HEAD` at the time of MONITOR creation)
- Link to the Railway dashboard for the failed deployment (construct from project + service + deployment ID)
- The exact `.[0].status` value observed (from `railway deployment list --json` — FAILED / CRASHED / REMOVED / SKIPPED, the triage route differs)

## Common Railway failure modes (for triage context)

- `FAILED` during BUILDING → usually missing build-time env var or dependency resolution error. Check `railway logs --deployment-id <id>` build section.
- `CRASHED` post-deploy → app started but died. Usually runtime env var, missing secret, or port binding issue. Check `railway logs` runtime section.
- `SKIPPED` → Railway saw a newer commit mid-queue and skipped this one. Not necessarily a code failure — may resolve by re-triggering from main.
- `REMOVED` → deployment was manually deleted from dashboard or via API. Almost always human action; check audit log.
