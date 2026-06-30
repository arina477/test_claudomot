# Wave 11 — L-2 Distill Observations

Synthesized from wave-11 artifacts (persistent verified prod test fixture; config/docs/script-only diff;
PR#22 squash-merged main@57927b1; V-APPROVED). Wave scope: ops/test-infra, no app code or migration change.
Prior archives consulted: process/waves/_archive/wave-{1,7,8,9,10}/blocks/L/observations.md.

---

## Observation 1 — CI false-green: `gh run watch --exit-status` streams last-completed job, not suite conclusion

- **What happened (system-level):** On the initial push (HEAD `71b6d8c`, run `28410747924`), `gh run watch --exit-status` returned exit code 0 while the suite conclusion was `failure` and `secret-scan` (gitleaks) had FAILED. The tool exited 0 because the last job whose output it had streamed was `e2e`, which passed — the tool reflects the exit status of the last-streamed job, not the aggregate run conclusion. The authoritative signals were `gh pr checks 22` (exit 1) and the run conclusion field (`failure`). The discrepancy was caught before merge; the branch was not merged in a false-passing state.
- **Source artifacts:**
  - `process/waves/wave-11/stages/C-1-pr-ci-merge.md` lines 28-28: "Initial run... `gh run watch --exit-status` returned 0 (last-streamed job was e2e), but `gh pr checks` exit 1 + run conclusion `failure` were authoritative — false-green caught; merge withheld."
  - `process/waves/wave-11/blocks/V/gate-verdict.md` finding ledger #3: "CI false-green angle (gh run watch vs gh pr checks) | low | ROUTE-TO-L — caught at C-1; new CI carry-forward."
  - `process/waves/wave-11/stages/V-2-triage.md`: "CI false-green (gh run watch vs gh pr checks) caught at C-1 → L candidate (new CI angle)."
- **Severity:** warning
- **Recurrence:** first-occurrence — no prior wave observation across wave-1, wave-7, wave-8, wave-9, wave-10 records the `gh run watch --exit-status` streaming-job-ordering mechanism producing a misleading exit code. Prior CI observations (wave-9 obs-1: deploy-verification false-green; wave-9 obs-2: CI-PRINCIPLES bypass) address different sub-classes. This is a novel mechanism.
- **Candidate principles file:** `command-center/principles/CI-PRINCIPLES.md`
- **Generalizable / Falsifiable / Cited:** yes — applies to any project using `gh run watch` for CI gate decisions; no — single-wave, cannot yet be confirmed as a stable pattern that warrants a rule; yes — C-1 artifact + V-block finding ledger both cite it directly.

---

## Observation 2 — Gitleaks false-positive on an identifier (UUID), resolved via scoped allowlist

- **What happened (system-level):** The gitleaks scanner flagged a SuperTokens user-id UUID (`21984eb2-8029-4c1b-9e73-bc586a0be4d2`) on a `project.yaml` comment line as `generic-api-key`. The value is a database record identifier, not a credential; no auth entropy meaningful to an attacker exists. A forward working-tree edit (removing the comment, cycle 1) did not clear the failure because gitleaks scans the full PR commit range (`bda813f^..HEAD`), not the working tree state. Cycle 2 added a triple-constrained `.gitleaks.toml` allowlist (exact commit + path + literal UUID regex; `[extend] useDefault=true`), which resolved the false positive while leaving all default rules active. An unrelated secret-shaped finding in the same run still fired under the config, confirming the allowlist is narrow and the scanner was not bypassed.
- **Source artifacts:**
  - `process/waves/wave-11/stages/C-1-pr-ci-merge.md` lines 30-33: full cycle-1 and cycle-2 account, including "a forward working-tree edit cannot clear a history-range scan" and the triple-constraint allowlist design.
  - `process/waves/wave-11/stages/V-1-karen.md` Check 3 (gitleaks allowlist is SCOPED, not a bypass): independent verification that `useDefault=true` is present and the allowlist suppresses one confirmed false positive only.
  - `process/waves/wave-11/blocks/V/gate-verdict.md` rationale: "the lone secret-adjacent literal in history is a SuperTokens user_id UUID (a DB record id, not a credential), suppressed via a triple-constrained scoped gitleaks allowlist with useDefault=true."
- **Severity:** informational
- **Recurrence:** first-occurrence — no prior wave observation records a gitleaks false-positive or an identifier-vs-credential classification issue. First cycle where a `.gitleaks.toml` allowlist was authored in this project.
- **Candidate principles file:** `command-center/principles/CI-PRINCIPLES.md`
- **Generalizable / Falsifiable / Cited:** yes — the history-range scan behavior applies to any project using gitleaks in CI over a PR commit range; yes — checkable: does a forward-commit deletion of a flagged value clear a CI gitleaks failure? If not, and an allowlist is needed, is `useDefault=true` present and the allowlist constrained to a single commit+path+value triple?; yes — C-1 and V-1-karen artifacts directly cited.

---

## Observation 3 — P-3 plan cited false prior-wave provenance; caught at P-4 before implementation

- **What happened (system-level):** The P-3 plan contained a NOTE asserting that the SuperTokens core admin-API email-verify path "was used successfully in waves 7/8/10" and was therefore a "known path." The archive directly contradicts this: waves 7, 8, 9, and 10 each record explicitly that no persistent verified fixture was ever provisioned, that the admin-API verify path was either cost-deferred or attempted and failed, and that the 4-wave absence of the fixture is the explicit cause of wave-11 existing. The false provenance claim did not invalidate the technical approach (the SDK documentation independently supports the path), but it changed the confidence framing: the NOTE characterized an unproven-against-prod path as confirmed, suppressing the fallback/escalate clause in the plan. P-4 (karen) caught the discrepancy via direct archive cross-reference and carried a corrective binding note to B: treat the path as first-time/unproven, keep the fallback clause live. The admin-API path worked (POST /servers 201 proof), vindicating the SDK-doc basis, but the provenance claim was factually wrong.
- **Source artifacts:**
  - `process/waves/wave-11/stages/P-3-plan.md` NOTE line: "waves 7/8/10 used it successfully, so it's a known path."
  - `process/waves/wave-11/stages/P-4-karen.md` Claim 2 (WRONG sub-claim section): archive citations from wave-8 C-2 ("deemed too costly") and wave-10 C-2 ("403 non-permitted... NOT live-verified... No prod verified-session fixture exists"). Binding carry-to-B: "treat the admin-API verify as first-time / unproven against prod; keep the P-3 fallback-or-escalate clause live."
  - `process/waves/wave-11/blocks/V/gate-verdict.md` finding ledger #2: "P-3 provenance claim ('admin-API used in waves 7/8/10') was factually wrong | low | ROUTE-TO-L — caught at P-4; claim-hygiene carry-forward."
  - `process/waves/wave-11/stages/V-1-karen.md` Minor section: "One P-3 source claim... was factually WRONG — corrected at P-4 to first-time/unproven-against-prod."
- **Severity:** warning
- **Recurrence:** first-occurrence as this specific mechanism (P-3 plan asserting false prior-wave execution). Wave-10 obs-5 (inflated test count, 270 claimed vs 176 actual) is the closest relative — both are plan or build artifacts carrying a false numerical or provenance claim that passed B-6 or planning gates. However wave-10 obs-5 was a B/T artifact (test count), not a P-3 plan confidence claim, and it was undetected until V-1. This wave's instance was caught earlier (P-4) and had lower consequence. The classes are related (inaccurate cross-stage factual claims) but the mechanisms differ; treating as first-occurrence of this specific sub-class.
- **Candidate principles file:** none (single-occurrence; the P-4 gate functions correctly as the existing structural control; no new rule warranted until a second confirming instance)
- **Generalizable / Falsifiable / Cited:** yes — any plan claiming prior-wave validation of an unproven path weakens the fallback posture; yes — checkable at P-4: do plan confidence claims citing prior-wave execution cite a specific artifact (commit, C-2 report, T-8 finding) rather than asserting a wave number alone?; yes — P-3-plan, P-4-karen, and V-block finding ledger all cited.

---

## Observation 4 — Verified-prod-fixture gap closed; T-8 principle condition from wave-10 L-2 now satisfiable

- **What happened (system-level):** Task 4a2ad286 (provision persistent verified prod test fixture) was wave-11's seed task, completing a 4-wave escalation streak recorded in wave-7 obs-2, wave-8 obs-3, wave-9 obs-3, and wave-10 obs-1. The fixture was provisioned (POST /servers 201 authed proof), credentials gitignored (test-accounts.md, verified at V-1 via git check-ignore exit 0 and git ls-files empty), and the EmailVerification REQUIRED claim confirmed satisfied by hitting a claim-gated route rather than the EV-exempt `/me`. Wave-10 L-2 deferred the T-8 principle candidate pending execution of this task: "promote (b) concurrently with executing (a) — make 4a2ad286 wave-11 seed, promote the T-8 rule at wave-11 L-2 once the fixture exists and was used." That condition is now met.
- **Source artifacts:**
  - `process/waves/wave-11/blocks/V/gate-verdict.md` rationale: "This wave achieves its goal: a repeatable verified prod fixture that closes the 4-wave authed-verification gap and enables M3 messaging live-verification."
  - `process/waves/wave-11/stages/V-1-jenny.md` AC1: "Live signin POST /auth/signin → status:OK, user.id=21984eb2... Authed POST /servers → 201 proves the EmailVerification REQUIRED claim is satisfied."
  - `process/waves/wave-11/stages/V-1-karen.md` Check 2 (Fixture works: PASS): independent re-run of authed 201 proof at review time.
  - `process/waves/_archive/wave-10/blocks/L/observations.md` obs-1 disposition_recommendation (b): "Promote at wave-11 L-2 once the fixture exists and was used."
- **Severity:** informational
- **Recurrence:** resolves a 4-wave recurring finding (wave-7 obs-2, wave-8 obs-3, wave-9 obs-3, wave-10 obs-1). This observation records the closure event and the satisfied precondition for the T-8 principle promotion.
- **Candidate principles file:** `command-center/principles/test-layer-principles/T-8.md` (promotion candidate per wave-10 L-2 obs-1(b); precondition now met; T-8.md Rules section is empty, no near-dup)
- **Generalizable / Falsifiable / Cited:** yes — the underlying principle (live authed authz verification requires a pre-provisioned verified session) applies to any project with a global session-verification gate; yes — checkable at T-8: does a verified prod account exist in test-accounts.md with a recorded user-id and confirmed email-verified status?; yes — V-block gate verdict, V-1 artifacts, and wave-10 L-2 obs-1 all cited.
