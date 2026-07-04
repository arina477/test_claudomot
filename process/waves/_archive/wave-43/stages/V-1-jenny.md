# V-1 Semantic-Spec Verification — jenny — wave-43 (M8 class scheduling, slice 3)

**Verdict: APPROVE**
**Findings: 4** (0 Critical, 0 High, 1 Medium, 3 Low — all gaps/notes, none block acceptance)
**Rationale:** Every acceptance-criterion's *intent* is satisfied by deployed behavior — organizer CRUD, compute-on-read weekly occurrence expansion (shared id, distinct startsAt, capped at recurrence_until AND the 90d window), single-field PATCH cross-field validation (B-6 H1), IDOR-safe serverId derivation, soft-delete/404 semantics, and the authoring modal + agenda calendar journey. The lone spec-literal divergence (POST returns 201 not 200) is a healthier HTTP status, not a behavioral defect.

Deployed: api `e7f1f7a` (https://api-production-b93e.up.railway.app) · web `7b0bc478` (https://web-production-bce1a8.up.railway.app). Probed live as fixture A (organizer of `ad62cd12-b78e-4a85-a214-042cf176b16c` "Fixture Proof Server"). Non-member 403 path not live-reproducible (fixture B broken — ENV gap, deferred to T-4 real-PG per prompt).

---

## 1. AC-by-AC semantic verdict

### Seed 535bdb8c — scheduling backend + authoring UI

- **AC1 (organizer creates one-off + weekly; POST DTO):** PASS (intent). Created one-off (`recurrence:none`) and weekly (`recurrence:weekly` + `recurrenceUntil`) — both persisted, DTO returned with organizer identity + recurrence descriptor. **Literal divergence:** POST returns **HTTP 201**, spec AC + `api` contract say "POST returns 200". See Finding F1 (Low — drift, benign).
- **AC2 (organizer edit/delete; serverId derived, IDOR-safe; non-organizer 403):** PASS on the reproducible half. PATCH title → 200; DELETE → 204; serverId is a path-derived value on `/scheduled-sessions/:id` (never a client param), and injecting `{"serverId":"000…"}` into a PATCH body was **ignored** (row's serverId unchanged) — IDOR-safe confirmed. Non-organizer 403 not live-reproducible (fixture B broken) → T-4 real-PG territory, not a drift.
- **AC3 (validation: endsAt>startsAt 400; weekly recurrenceUntil<startsAt 400; none ignores recurrenceUntil):** PASS. `endsAt<startsAt` → 400; `endsAt==startsAt` → 400; `weekly + recurrenceUntil<startsAt` → 400 ("recurrenceUntil must be on or after startsAt for weekly recurrence"); `recurrence:none` with a *past* recurrenceUntil → 201 accepted and **not expanded** on read (ignored, as specified). Bonus: closed-enum enforced — `recurrence:"daily"` → 400 ("Expected 'none' | 'weekly'"); empty title → 400.
- **AC4 (soft-deleted excluded from list/get; unknown/deleted :id → 404):** PASS. After DELETE: GET/PATCH/DELETE of that id → 404 ("Session not found"); absent from list. Unknown random uuid → 404. Malformed non-uuid id → 400 (global 22P02→400 filter, as designed).
- **AC5 (authoring modal mirrors AssignmentForm, gated on manage_assignments, calendar reflects):** PASS. "New session" CTA present on the Schedule view; opens a `[role=dialog]` modal with fields: Session Title *, Description, Date *, Start Time *, End Time *, Recurrence `<select>` {Does not repeat (One-off) | Weekly}. Selecting **Weekly reveals "Repeat Until (Optional)"** — the recurrence_until descriptor. API-created session appeared in the agenda immediately (calendar reflects). CTA gating is structurally present; A is organizer everywhere so the hidden-for-non-organizer state is the fixture-B ENV gap (T-4).
- **AC6 (NO RSVP/reminders/timezone-negotiation/ICS):** PASS. No RSVP/reminder/timezone/ICS/grade fields in any DTO (banned-substring scan clean) and none in the authoring modal. UTC timestamptz stored, server-local displayed (agenda shows "10:00 AM — 11:00 AM").

### Sibling cdf81427 — class calendar view (member list)

- **AC1 (member lists non-deleted, starts_at ASC, carries organizer identity):** PASS. `GET /servers/:id/scheduled-sessions` returns `{sessions:[...]}`, each with title/description/startsAt/endsAt/recurrence + nested `organizer{userId,displayName,username,avatarUrl}`. Windowed list verified **ascending by startsAt** (29-row window, `starts==sorted(starts)` true).
- **AC2 (weekly → occurrences within window, compute-on-read, no materialized rows; one-off shows once):** PASS — this is the headline semantic. Weekly with recurrenceUntil 5 weeks out → window covering it returned **6 occurrences** (Sep 1/8/15/22/29, Oct 6), all **sharing one id**, distinct startsAt, capped exactly at recurrence_until. Narrow 10-day window → **1** occurrence. One-off ids never appear >once in a wide window. No default expansion when no `from`/`to` given (raw row returned) — client supplies the window.
- **AC3 (agenda groups by date; empty → calm empty state; non-member 403):** PASS on reproducible parts. Agenda renders session cards with title + "Weekly" badge + time range. Empty-state + non-member 403 not live-reproducible on A's populated organizer servers (ENV: no empty non-member context) — deferred to T-4.

### Sibling 1216146e — session detail

- **AC1 (member GET /scheduled-sessions/:id, serverId derived):** PASS. `GET /scheduled-sessions/:id` → 200 full DTO (title, description, start/end, recurrence, organizer). serverId derived from row.
- **AC2 (organizer sees role-gated Edit+Delete; non-organizer read-only; backend 403):** PASS on reproducible half. As organizer, Edit + Delete affordances render on the session surface. Backend 403 for non-organizer edit/delete is enforced by the same assertOrganizer used on PATCH/DELETE (structurally shared) but the non-organizer *read-only* rendering is not live-reproducible (fixture B) → T-4. See Finding F4 (Low — note).
- **AC3 (unknown/deleted id → 404 calm not-found):** PASS. Backend returns 404 for unknown/deleted; UI surfaces it (not a crash).

---

## 2. Edge-case probe results (all as organizer A)

| Probe | Expected | Observed | Verdict |
|---|---|---|---|
| weekly + recurrenceUntil → GET expands within window | all shared id, distinct startsAt, capped at until | 6 occ, one id, capped at Oct 6 | PASS |
| narrow window on weekly | subset | 10-day window → 1 occ | PASS |
| huge window (1yr) on far-until weekly | bounded to 90d | 13 occ spanning **84 days** (next would be day 91) | PASS |
| endsAt < startsAt | 400 | 400 (field error) | PASS |
| endsAt == startsAt | 400 | 400 | PASS |
| weekly recurrenceUntil < startsAt | 400 | 400 | PASS |
| recurrence=none + recurrenceUntil set | accepted, ignored on read | 201, no expansion | PASS |
| single-field PATCH startsAt after persisted endsAt (B-6 H1) | 400 | 400 ("endsAt must be after startsAt") | PASS |
| single-field PATCH endsAt before persisted startsAt | 400 | 400 | PASS |
| GET/PATCH/DELETE soft-deleted id | 404 | 404 | PASS |
| GET unknown uuid | 404 | 404 | PASS |
| GET malformed id | 400 (22P02 filter) | 400 | PASS |
| PATCH body serverId injection | ignored (IDOR-safe) | ignored | PASS |

## 3. Contract conformance

Create → 201 with full DTO incl. `organizer{userId,displayName,username,avatarUrl}` + `recurrence`/`recurrenceUntil`. List → `{sessions:[occurrences]}`. Detail → single DTO. **No grade/reminder/rsvp/attendance/ics/notification/timezone field anywhere** (JSON-flatten substring scan clean). DTO top keys: `description,endsAt,id,organizer,organizerId,recurrence,recurrenceUntil,serverId,startsAt,title`.

## 4. Journey continuity

Signin → app → server rail (FP) → **Schedule** tab (member-visible agenda) → "New session" modal (author) → session card renders in agenda → inline Edit/Delete affordances for organizer. No dead-ends, no unhandled errors during the traversal. The member read-only path is hidden because A holds manage_assignments everywhere — the intended `manage_assignments` gate, not a defect; the true non-member 403 is the fixture-B ENV gap.

---

## Findings

**F1 — POST returns 201, spec says 200 · Severity: Low · DRIFT (benign).**
Spec §535bdb8c AC1 + `contracts.api` state "POST returns 200 with the session DTO". Deployed POST returns **201 Created**. 201 is the semantically-correct status for resource creation; the DTO and body are exactly as specified. Recommend a P-2 spec-text correction (200→201) rather than a code change. Cite: DB tasks.description §535bdb8c AC1.

**F2 — DTO omits createdAt/updatedAt · Severity: Medium · GAP (spec-vs-projection).**
Spec `ScheduledSessionSchema` (contracts.types) lists `createdAt, updatedAt`. The deployed DTO does **not** surface them (top keys enumerated above). No AC *behavior* depends on them and no consumer surface needs them, so this is a projection gap, not a functional break. Flag for P-2/Karen source-truth reconciliation: either the schema over-specified or the rowToDto under-projects. Cite: DB tasks.description §535bdb8c contracts.types ScheduledSessionSchema.

**F3 — 90d window cap is off-by-count-favorable, not off-by-spec · Severity: Low · NOTE (correct).**
Huge window yielded 13 weekly occurrences spanning 84 days (12 weeks from the `from` anchor); the 91-day occurrence is excluded. Behavior matches the "bounded to 90d" intent (P-3 compute-on-read window bound). No action — recording the observed bound so T-4/perf can assert the same number.

**F4 — Non-member 403 + non-organizer read-only detail not live-reproducible · Severity: Low · NOTE (ENV gap).**
Fixture B is broken (no live non-organizer/non-member session), so AC2/AC3 negative-authz paths (403 for non-member list, read-only detail for non-organizer, empty-state) could not be exercised against production. assertOrganizer/assertMember are structurally shared with the reproducible positive paths and with the mirrored assignments module. Rely on T-4 real-PG evidence. Not a drift; do not block on it.

---

**No drift that breaks acceptance. All ACs semantically satisfied on the reproducible surface; the three unreproducible negatives are a single ENV gap covered by T-4.** Verdict: **APPROVE**.
