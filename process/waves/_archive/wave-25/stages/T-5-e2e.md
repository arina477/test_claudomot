# T-5 E2E — wave-25 mention parser parity (LIVE PRODUCTION)

**Target:** https://web-production-bce1a8.up.railway.app/ (live prod, Railway)
**Fixture:** studyhall-e2e-fixture@example.com / username `studyhallfixturea` (email-verified). Password read from `command-center/testing/test-accounts.md` (`e2e-fixture`), redacted as *** — never printed.
**Server/channel:** "Fixture Proof Server" (ad62cd12-b78e-4a85-a214-042cf176b16c) → existing `#general` channel.
**Method:** Post message as fixture, then inspect the rendered message DOM. Each scenario run TWICE (two full passes) for flake detection.

## Tooling note — Playwright MCP unavailable; bundled-Chromium fallback used
All 10 Playwright MCP instances (`mcp__playwright-1..10`) fail at browser launch:
`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`.
`@playwright/mcp@latest` defaults to the **chrome channel**, whose Linux path (`/opt/google/chrome/chrome`) does not exist; `/opt` is not writable and `su` fails, so no MCP instance can be unblocked from a sub-agent. This is a **session-wide infra defect**, not a product fault. Rather than report a zero-evidence BLOCKED, I drove the **validated bundled Chromium** (`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`) directly via the installed `playwright-core` module. Rendering path (React client tokenizer + `MentionPill`) is identical to what the MCP would exercise; only the driver differs. No `browser_close` was issued against any MCP instance (they never launched a context). `testers_spawned: 1` = one browser driver session, two sequential passes.

## Pill signature (learned from live DOM)
A **resolved** mention renders as:
`<span aria-label="mention: @<user> (you)" class="inline-flex items-center ... rounded-md ...">@handle</span>`
with emerald chip styling `background-color: rgba(16,185,129,0.1); color: rgb(110,231,183); outline: rgba(16,185,129,0.3) solid 1px`.
An **unresolved** mention (or trailing punctuation) renders as a **bare `<span>`** text node with no `mention:` aria-label and no chip background. Detection: pill = `[aria-label^="mention:"]`.

## Scenario verdict table

| # | Criterion | Input | Expected | Observed (both passes) | Verdict |
|---|-----------|-------|----------|------------------------|---------|
| 1 | AC2 resolved→pill | `hello @studyhallfixturea here` | `@studyhallfixturea` PILL; `hello`/`here` plain | 1 pill `@studyhallfixturea` (emerald chip); `hello`/`here` plain | **PASS** |
| 2 | AC2 dot-suffix (headline) | `ping @studyhallfixturea.done` | `@studyhallfixturea` PILL; `.done` plain trailing, NOT swallowed | pill text is exactly `@studyhallfixturea`; `.done` renders as plain text immediately after the pill | **PASS** |
| 3 | AC3 unresolved→plain | `hey @nobodyxyz12345 there` | `@nobodyxyz12345` PLAIN, no pill | `pills: []`; `@nobodyxyz12345` stays plain text | **PASS** |
| 4 | AC3 mixed | `@studyhallfixturea meet @ghost99nonexistent` | one pill + one plain, same message | 1 pill `@studyhallfixturea`; `@ghost99nonexistent` plain | **PASS** |

## DOM / visual evidence per scenario

**S1 — resolved→pill** (`s1-pass1.png`, `s1-pass2.png`)
```
<p ...><span>hello </span><span><span aria-label="mention: @studyhallfixturea (you)"
  class="inline-flex ... rounded-md ..." style="background-color: rgba(16,185,129,0.1); ...">@studyhallfixturea</span></span><span> here ...</span></p>
pills: [{label:"mention: @studyhallfixturea (you)", text:"@studyhallfixturea", bg:"rgba(16,185,129,0.1)"}]
plain (pill removed → ␣): "hello ␣ here ..."
```

**S2 — dot-suffix (headline fix)** (`s2-pass1.png`, `s2-pass2.png`)
```
fullText: "ping @studyhallfixturea.done ..."
pills:    [{text:"@studyhallfixturea"}]          # pill text is EXACTLY the handle, .done NOT included
plain (pill removed → ␣): "ping ␣.done ..."      # .done is plain text right after the pill
```
Screenshot confirms: `ping` plain, `@studyhallfixturea` emerald chip, `.done` plain trailing. The pill does **not** swallow `.done`, and the whole token is **not** rendered as plain text. Headline parity fix holds on live prod.

**S3 — unresolved→plain** (`s3-pass1.png`, `s3-pass2.png`)
```
fullText: "hey @nobodyxyz12345 there ..."
pills:    []                                     # no mention pill at all
plain:    "hey @nobodyxyz12345 there ..."        # handle stays bare text
```

**S4 — mixed** (`s4-pass1.png`, `s4-pass2.png`)
```
fullText: "@studyhallfixturea meet @ghost99nonexistent ..."
pills:    [{text:"@studyhallfixturea"}]          # exactly one pill
plain (pill removed → ␣): "␣ meet @ghost99nonexistent ..."   # ghost handle stays plain in the same message
```
Screenshot confirms one green chip + one plain `@ghost99nonexistent` side by side.

## Verdict on acceptance criteria (live prod)
- **AC2 (resolved → pill, incl. dot-suffix):** HOLDS. Server-resolved handle `@studyhallfixturea` (self-mention resolves) renders as a `MentionPill`; trailing `.done` is emitted as plain text after the pill, not absorbed.
- **AC3 (unresolved → plain):** HOLDS. `@nobodyxyz12345` and `@ghost99nonexistent` (not in `mentions[]`) render as bare literal text with no pill, including alongside a resolved pill in the same message.

All 4 scenarios PASS on both passes. Zero flakes, fully deterministic. Evidence: `process/waves/wave-25/stages/t5-evidence/` (per-scenario PNGs + `results.json` full DOM dump).

```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios:
  - {id: 1, criterion_ref: AC2-resolved-pill, verdict: PASS, evidence_path: process/waves/wave-25/stages/t5-evidence/s1-pass1.png}
  - {id: 2, criterion_ref: AC2-dot-suffix, verdict: PASS, evidence_path: process/waves/wave-25/stages/t5-evidence/s2-pass1.png}
  - {id: 3, criterion_ref: AC3-unresolved-plain, verdict: PASS, evidence_path: process/waves/wave-25/stages/t5-evidence/s3-pass1.png}
  - {id: 4, criterion_ref: AC3-mixed, verdict: PASS, evidence_path: process/waves/wave-25/stages/t5-evidence/s4-pass1.png}
flakes_observed: []
fix_up_cycles: 0
findings:
  - {severity: low, scenario: infra, description: "Playwright MCP unusable on live session — @playwright/mcp defaults to chrome channel at /opt/google/chrome/chrome which is absent and /opt is unwritable (su fails). All 10 instances fail identically at browser launch. Tooling defect, not a product fault. T-5 completed via bundled Chromium (chromium-1228) driven through playwright-core; identical render path. Fix upstream: pin MCP to --browser chromium or install the chrome channel."}
```
