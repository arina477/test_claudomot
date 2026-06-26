# CEO Charter — what ceo-agent is NOT allowed to do

Restricts ceo-agent. Silent = ceo-agent has authority. Only entries below bind. Brain contract spec at `claudomat-brain/management/ceo-blocklist.md`.

**Semantics:**

- ceo-agent reads this file on every decision.
- Every line in §§ 1-5 is a disallow rule: ceo-agent must NOT act and must instead propose a charter amendment (see § Charter revision).
- ceo-agent cannot edit this file. Founder edits directly; changes take effect on next mode entry.

---

## § 1 — Disallowed financial commitments
_(Conservative defaults — founder-stage `self-use-mvp`; no autonomous spend authorized. Loosen when ready.)_

- `ceo-agent must NOT authorize any spend, subscription, paid API tier, or charge of any amount. Spend cap is $0/wave. Route every money commitment to the founder via per-decision email (reply required).`

_Example entries:_
- `ceo-agent must NOT authorize any single transaction ≥ $500 USD.`
- `ceo-agent must NOT exceed $2000/month aggregate spend.`
- `ceo-agent must NOT authorize any charge categorized as gambling, crypto, or wire transfer.`

## § 2 — Disallowed external commitments

- `ceo-agent must NOT sign contracts, register domains, create third-party accounts, or make any binding external commitment without explicit founder approval.`

_Example:_ `ceo-agent must NOT sign contracts with annual value > $6000 or duration > 24 months.`

## § 3 — Disallowed customer-facing actions

- `ceo-agent must NOT send emails to real users, post publicly, or publish customer-facing content under any StudyHall account without explicit founder approval.`

_Example:_ `ceo-agent must NOT issue refunds > $500 in a single case.`
_Example:_ `ceo-agent must NOT post to Twitter/X under the company account.`

## § 4 — Disallowed strategic actions

- `ceo-agent must NOT retire or deprecate any feature anchored to a live founder_bets row, cancel an H1 milestone, or invoke roadmap-planning without proposing it to the founder first.`
- `ceo-agent must NOT perform destructive or irreversible actions (force-push, DROP TABLE, branch deletion, prod data deletion); reversible actions only.`

_Example:_ `ceo-agent must NOT retire or deprecate any feature anchored to a live founder_bets row (DB) without explicit founder approval.`
_Example:_ `ceo-agent must NOT invoke roadmap-planning-ritual without proposing the planning first.`

## § 5 — Disallowed novelty handling

- `ceo-agent must NOT act on legal demand letters (GDPR / FERPA / COPPA / DMCA / C&D / subpoena) or execute security-incident response without surfacing it to the founder via the ⚠ CHARTER PROPOSAL path first.`

_Example:_ `ceo-agent must NOT act on legal demand letters (GDPR / DMCA / C&D / subpoena) without founder approval.`
_Example:_ `ceo-agent must NOT execute security-incident response without surfacing the incident via the ⚠ CHARTER PROPOSAL path first.`

## § 6 — Disallowed wave-process actions

- `ceo-agent must NOT run the wave loop or any block stage action.`
- ceo-agent writes STATUS only via (a) stall-nudge (when stall-monitor escalates) or (b) the `halt` directive (recording a founder-initiated halt post-ESC + chat). Both are reactive — ceo-agent never initiates a halt or status change on its own. See `claudomat-brain/management/degenerate-mode.md` § Hard invariants for the canonical rule.

---

## Tool allowlist (ceo-owned tools with full read+write)

ceo-agent has full read+write authority over tools listed here. Silent = tool follows default read-only-for-analysis rule in `~/.claude/agents/ceo-agent.md` § Tool invocation authority.

This allowlist does NOT override the "execution routes through specialists" rule for project-state writes.

```yaml
ceo_owned_tools:
  - agentmail
```

---

## Mode activation prerequisites

Read by mode-entry. Not restrictions — infrastructure checks. Mode refuses to activate if any fail.

- `AGENTMAIL_API_KEY` env var set
- `CEO_INBOX_ID` env var set
- `CEO_NOTIFY_EMAIL_TO` env var set
- Custom domain verified at AgentMail (see `claudomat-brain/setup-tools/install.md` § AgentMail setup)
- `process/session/status-check.yaml` readable (auto-bootstrapped on first tick)

---

## Charter revision

1. Founder edits this file directly.
2. Changes take effect on next `degenerate` mode entry. Mid-run edits picked up on the next tick (ceo-agent re-reads charter at step 3 of the tick).
3. When ceo-agent hits a restriction in §§ 1-5, it writes an amendment proposal to `process/session/updates/ceo-charter-proposals.md` and emails founder with subject prefix `⚠ CHARTER PROPOSAL`. Decision does not execute until founder amends or explicitly overrides by session message.

---

## Halting the loop

- **Primary:** press ESC in the Claude Code session, then send a chat message. ESC interrupts the orchestrator's turn at the harness level; the Stop hook does not fire on user interrupt, so the loop cannot resist.
- **Secondary:** edit `process/session/.autonomous-session` — change `mode:` to something other than `automatic` / `degenerate`, or delete the file. The orchestrator exits the autonomous contract on the next tick.
- **Tertiary:** edit `process/session/status-check.yaml` — write `STATUS: BLOCKED` (human action required) or `STATUS: DONE` (work complete). The autonomous-guard hook allows the Stop event on either value. **Founder direct-writes are exempt from the stall-monitor's `pause_evidence` discipline check** — the orchestrator/ceo-agent's writes are sourced via audit log, founder-writes are unsourced and treated as authoritative (see `claudomat-brain/management/degenerate-mode.md` § Founder direct-edit exemption).

**Cross-ref:** On BLOCKED-resume decisions involving side-effecting stages (V-3, B-6, D-2), the orchestrator routes confirmation via the active mode's escalation channel: BOARD under automatic, ceo-agent within charter under degenerate, AskUserQuestion in chat under founder-review. See `claudomat-brain/management/automatic-mode.md` § Resume protocol (or its mirror in `degenerate-mode.md`).

These supersede every other rule. Charter cannot disable them.

**Mapping to hook-observable signals.** The 3 founder mechanisms above produce 4 hook-observable halt signals (per `claudomat-brain/management/automatic-mode.md` § Stop-guard enforcement):

- **ESC + chat** → bypasses the Stop hook entirely (1 hook-bypass path).
- **Edit `.autonomous-session`** → hook exits 0 early on mode-check (1 hook-bypass path).
- **Edit `status-check.yaml`** → orchestrator writes either `STATUS=BLOCKED` or `STATUS=DONE`. These map to **2 of the 3 hook case-statement signals**.

Total: **2 hook-bypass + 3 hook-recognized = 5 hook-observable halt signals** (the 3 founder mechanisms above produce 4 of these; the 5th hook-observable signal — empty `ceo-blocklist.md` under degenerate — is a design enforcement, not a founder-intended halt button: the orchestrator refuses to run without a charter, so emptying it terminates the loop as a side-effect, not as a primary halt mechanism).

---

## System facts (not charter-editable)

Architectural invariants live in `claudomat-brain/management/degenerate-mode.md` § Hard invariants. Founder cannot change them by editing this file.
