# L-1 — Docs (wave-12 M3 real-time messaging)

## CHANGELOG (Added)

Appended to `CHANGELOG.md` § [Unreleased] → ### Added:

> - Real-time messaging: send and receive messages in your study channels live. (#23)

Cites PR #23 (the merged M3 messaging slice). Terse, founder-facing (plain outcome-first language per rule 16).

## Milestone delta

- **M3 — Real-time messaging** (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`): first bundle (3 tasks) DONE.
  - Tasks closed at L-2: `a0c322b4` (MessagingModule REST), `723b5b6a` (/messaging Socket.IO gateway WS-auth), `d999d29c` (message UI primitives).
  - **Real-time-delivery core of the success metric is MET**: two students exchange messages in real time, live-verified at **93ms / 87ms** across two runs (target <1s), with room-scoped no-leak and WS-upgrade auth enforced (C-2 deliverable, V-block APPROVED).
- **Status: stays `in_progress`.** No transition. The full M3 success-metric prose reads "<1s delivery, **with reactions, threads, and attachments working**" — only the real-time-delivery core shipped this wave. The metric is partially satisfied, not complete.
- **Remaining M3 scope** (per milestone `## Scope`): reactions, thread replies, mentions, file/image attachments, presence + typing (/presence namespace), member list with presence — plus carried tech-debt (null-key `.returning()` cleanup) and the M2-deferred member-list / route-wiring.
- Milestone prose NOT edited: no `_TBD_` to finalize, and the success criterion is multi-part / only partially met.

### Flag for N-1

**Decompose M3's NEXT bundle.** Candidate next slices (N-1 / milestone-decomposer picks the highest-value one): presence + typing indicators, OR reactions, OR message edit/delete, OR the deferred member-list-with-presence. M3 has ample remaining scope; the queue needs one bundle (1 seed + 0-N siblings) authored before the next wave's P-0 can seed.

## Doc-delta coverage (shipped surfaces this wave)

The T-9 Journey regen (commit `a7e0fd5`) already covered the shipped surfaces:
- New route/namespace: `/messaging` Socket.IO gateway (WS-upgrade auth via `auth.accessToken`).
- New REST: `GET /channels/:id/messages` + message send (channel-gated, auth-required).
- New page surface: page 9 chat (message-row 3 states + composer + list).
- Migration 0005 (messages table) live in prod.

No additional changed surface is missing from the journey map. No README touch needed (no new run/setup step).

---

```yaml
l_stage_verdict: COMPLETE
verdict_evidence:
  - "CHANGELOG.md § Unreleased/Added: real-time messaging line, cites #23"
  - "milestone M3 6198650e: first bundle done, stays in_progress; real-time-delivery core of metric MET (93ms/87ms live)"
  - "N-1 flag: decompose M3 next bundle (presence/typing OR reactions OR edit/delete OR member-list)"
  - "doc-delta coverage verified via T-9 journey regen a7e0fd5 (/messaging, GET /channels/:id/messages, page-9 chat, migration 0005)"
note: "M3 stays in_progress — reactions/threads/attachments/presence/member-list remain; success metric partially (delivery-core) met."
```
