# P-4 Phase-2 — Spec-vs-Roadmap Drift Check (jenny)

**Wave:** 15 — M3 @mentions (multi-spec)
**Spec source (canonical):** `tasks.description` of `3d238446` (wave-15-spec, 3 claimed specs)
**Roadmap source:** M3 milestone `6198650e` prose; feature-list #8/#14; product-decisions log
**Verdict:** **APPROVE** — spec matches roadmap with no drift on any checked item.

---

## Per-item findings

### 1. 3-block spec ↔ M3 `## Scope` "mentions" — **MATCHES (1:1)**
M3 `## Scope` lists "...edit/delete, reactions, thread replies, **mentions**, file/image attachments, presence...". The wave claims exactly the "mentions" clause and nothing adjacent. The 3 specs map cleanly onto the one scope word:
- `3d238446` data plane (parse/resolve/persist + realtime + my-mentions)
- `cd585f04` composer autocomplete member-picker
- `c3f3f62a` mention pills + unread affordance

No thread_parent_id work, no attachments/S3 work — both correctly left to later M3 waves (matches decomposition note in product-decisions line 207–211 and milestone "Threads + attachments remain later-M3" in spec prose). MATCHES.

### 2. mention-primitive (#8) vs notifications (#14) boundary — **MATCHES (stays on the primitive)**
Feature-list separates **#8 "Message actions (... mention)"** from **#14 "Notifications (mentions, DMs, assignment reminders)"** (a distinct H1 feature, its own dependency: "notification dispatch"). The spec stays entirely on the #8 primitive — parse / resolve / persist (`message_mentions`) / realtime signal over existing gateway / pills / `GET /me/mentions`. It does NOT build the #14 notification-dispatch surface. Spec prose states this explicitly: "Notification-inbox surface OUT (feature #14, later milestone)." MATCHES.

**Unread-mention affordance judgment — primitive-level, NOT drift.** AC (`c3f3f62a`): the affordance is a badge/highlight "driven by the seed's realtime mention event + GET /me/mentions; clears when the viewer views the channel/message." This is a per-channel/per-message badge derived from the mention event + my-mentions query + client last-read state. There is **no notification center / inbox route, no persisted notification entity, no dispatch fan-out across surfaces** — journey map confirms no new page route is proposed, and `/me/mentions` is a list endpoint, not an inbox surface. The affordance is the read-side projection of the mention primitive, which is what makes the primitive useful; it does not cross into #14. No drift.

### 3. Realtime-namespace product-decision (2-namespace lock) — **MATCHES (honors the lock)**
product-decisions v6b §(8): "**2 Socket.IO namespaces (`/messaging`, `/presence`)**". Spec AC #3 + `contracts.api` require the mention realtime signal to ride the **EXISTING `/messaging` room-per-channel gateway (no new namespace)**, explicitly named in both the AC and the milestone prose ("Reuses ... wave-12 /messaging gateway (no new namespace)"). The 2-namespace lock is honored — no third namespace introduced. MATCHES.

### 4. Scope-creep exclusions (@everyone/@here/@role OUT; notification-inbox OUT) — **MATCHES (none in scope)**
- `@everyone/@here/@role`: milestone prose SECURITY clause states "@everyone/@here/@role OUT of scope this wave (noise/moderation blast-radius; calm-brand)." No AC in any of the 3 specs references group/broadcast mention tokens; resolution AC #1 resolves only individual `@username` tokens to real channel-server members. OUT confirmed.
- notification-inbox: covered in item 2 — explicitly OUT, feature #14. OUT confirmed.
No extra/unspecified scope detected. MATCHES.

### 5. M3 success-metric — **MATCHES (mentions correctly does NOT claim to close M3)**
M3 `## Success metric` requires "messages in real time (<1s delivery), with reactions, **threads, and attachments** working." Spec prose explicitly states "Threads + attachments remain later-M3." Neither the spec head nor any AC claims M3 closure. The milestone stays `in_progress`; this wave ships one `## Scope` item, not the success-metric gate. Correct — no premature-close drift. MATCHES.

---

## Notes (non-blocking, not drift)
- Spec adds a NEW migration (0007 `message_mentions`) — first schema change since 0006. This is anticipated by both P-0 frame and the decomposition note (line 209: "per-message mention persistence"); it is the correct data home for authz-scoped my-mentions + unread (parse-on-read could not serve those). Within roadmap intent — not drift.
- Carry-forward only (already P-0-flagged): wave is ~2200 LOC, below the multi-spec floor; P-0 disposition was PROCEED with floor flag. Not a spec-vs-roadmap drift item — P-4 head gate / B-block concern.

## Disposition
**APPROVE.** All five checked dimensions MATCH. No conflicting milestone clause, product-decision, or feature-list boundary. The spec is a faithful, scoped slice of M3's "mentions" clause that respects the #8/#14 boundary, the 2-namespace lock, the @everyone/notif-inbox exclusions, and does not over-claim the M3 success metric.
