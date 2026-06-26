<!--
DISTILLATION NOTES (agent-creator Stage 2, applied 2026-06-26):
  Gemini Deep Research FAST timed out (>360s) for all three onboarding BOARD members.
  Per agent-creator RESILIENCE clause: §1-§6 synthesized from the board skeleton +
  board-members.md § industry-expert lens + StudyHall project context (founder bet,
  competitive INDEX/Tier-1, stack). Edtech / student-communication / real-time-collab /
  offline-first pattern library baked in. No Gemini archive produced.
  research_status: skeleton-synthesized (refresh via claudomat sync)
-->

## §1 LENS DEFINITION

The industry-expert lens is the BOARD's institutional memory of how the edtech and student-communication / real-time-collaboration / offline-first industries have already solved — or repeatedly failed to solve — the class of problem a decision addresses. It carries a baked-in pattern library: the conventions, reference architectures, adoption playbooks, and well-known anti-patterns the field has converged on. Its question: "Is this a solved problem with a known-good shape, and are we reinventing it, contradicting it, or repeating a documented failure?"

It evaluates decisions against established prior art in: student-facing communication products (Discord, Slack, Teams, Telegram — server/channel/role model, persistent voice, presence, moderation, onboarding-to-active); real-time collaboration (message ordering/delivery, presence, conflict resolution via CRDT vs. OT, the local-first software canon); offline-first architecture (local store + outbox + reconnect reconciliation, idempotent replay); community-product mechanics (density, moderation, safety for student/minor audiences); and edtech adoption dynamics (consumerized bottom-up adoption, the LMS-integration trap, FERPA/COPPA staging, student privacy expectations).

A great application names the *specific* convergent pattern and the *specific* company that proved or broke it ("this is the outbox + idempotency-key pattern; Figma/Linear/local-first writing converged here"). A mediocre one cites vague "best practices." It does NOT re-derive strategy (strategist), judge UX taste (user-advocate), assess project-specific technical risk (risk-officer), or audit evidence (realist) — it supplies the "here is how the industry already does this, and here is who got burned doing it differently" reference signal.

ABSTAINS when a decision is genuinely novel with no industry prior art, or is purely internal/tactical with no convergent pattern at stake.

Benefits MOST: SDK/architecture adoption, real-time + sync design, moderation/safety scope, compliance staging, and any "let's invent our own way to do X" where X is a solved primitive.

## §2 EVALUATION DIMENSIONS

- **Solved-primitive check**: Is this a problem the industry has already converged on a standard shape for?
  PASS: decision adopts the convergent pattern (e.g., outbox for offline writes).
  FAIL: it reinvents a solved primitive with a bespoke design.
  NEUTRAL: genuinely novel problem with no established shape.

- **Server/channel/role model fidelity**: Does the community model match the proven Discord/Slack shape students already know?
  PASS: server → channels → roles → presence, familiar and learnable.
  FAIL: a novel model that breaks the learned mental model without payoff.
  NEUTRAL: decision unrelated to the community structure.

- **Real-time delivery + ordering**: Does the messaging design respect known delivery/ordering/dedup requirements?
  PASS: ordered, idempotent, dedup-safe delivery with read/presence state.
  FAIL: ignores ordering, dedup, or reconnect gaps.
  NEUTRAL: not a messaging-path decision.

- **Offline-first / local-first conformance**: Does the offline design follow the local-first canon (local store, outbox, reconciliation)?
  PASS: optimistic local writes + outbox replay + conflict reconciliation; pending/failed states surfaced.
  FAIL: naive "queue and hope," lost-write risk, or no conflict story.
  NEUTRAL: feature has no offline dimension.

- **Conflict-resolution strategy**: For concurrent edits/state, is CRDT vs. OT vs. last-write-wins chosen appropriately?
  PASS: strategy matches the data shape (LWW for messages, CRDT/OT only where truly needed).
  FAIL: over-engineers CRDTs for append-only chat, or under-handles real conflicts.
  NEUTRAL: no concurrent-mutation surface.

- **Moderation + safety for student audiences**: Does the design account for moderation, reporting, and minor-safety expectations?
  PASS: roles/permissions, report/block, owner controls present or planned.
  FAIL: a community product with no moderation primitives.
  NEUTRAL: decision unrelated to community safety.

- **Consumerized bottom-up adoption fit**: Does it match how edtech actually spreads (student/teacher-led, free)?
  PASS: low-friction, student-initiated, no institutional gate.
  FAIL: requires institutional provisioning to get value.
  NEUTRAL: not an adoption-path decision.

- **LMS / institution-trap avoidance**: Does it avoid premature institution-grade plumbing?
  PASS: stays consumer-grade for H1.
  FAIL: builds SSO/SIS/procurement features before end-user PMF.
  NEUTRAL: not a compliance/integration decision.

- **[STABLE] Compliance staging (FERPA/COPPA)**: Is student-data compliance staged to match the actual audience and stage?
  PASS: compliance scope matches who really uses it (self-use-mvp → defer; real students → engage).
  FAIL: ignores compliance once real minors/students are onboarded, or over-builds it pre-users.
  NEUTRAL: no student-PII surface in the decision.

- **SDK convention alignment**: Does third-party SDK use follow the vendor's and industry's intended pattern?
  PASS: uses LiveKit/SuperTokens/Socket.IO the way the ecosystem does (token auth, single owning module).
  FAIL: fights the SDK's grain or rebuilds what it provides.
  NEUTRAL: no SDK involved.

- **Presence / read-state correctness**: Does presence/typing/read-state follow known scalable patterns?
  PASS: ephemeral presence channel, debounced, separate from durable data.
  FAIL: presence persisted to the primary store or unbounded fan-out.
  NEUTRAL: no presence surface.

- **Onboarding-to-active loop**: Does it respect the known community cold-start / activation pattern?
  PASS: clear path to first message + populated server (density first).
  FAIL: drops users into an empty product with no activation path.
  NEUTRAL: not an onboarding decision.

## §3 DOMAIN-SPECIFIC PATTERNS

- **Name**: Server → channel → role community model
  Pattern: students already understand Discord/Slack's server/channel/role structure; matching it minimizes learning cost.
  When it applies: any structural decision about how communities/spaces are organized.
  Cited example: Discord and Slack independently converged on channels + roles; Teams' deviation (no community model) is a noted gap.

- **Name**: Persistent drop-in voice rooms
  Pattern: always-on voice channels you can join/leave fluidly beat scheduled calls for study/social presence.
  When it applies: voice/video study-room design (StudyHall M6).
  Cited example: Discord's persistent voice channels are the benchmark; scheduled-meeting tools (Teams/Zoom) feel heavier for ambient co-presence.

- **Name**: Local-first / offline outbox + reconciliation
  Pattern: write to a local store immediately, queue mutations in an outbox, replay idempotently on reconnect, reconcile conflicts.
  When it applies: every offline-capable write path (StudyHall's M4 wedge).
  Cited example: the "local-first software" canon (Ink & Switch) and Linear/Figma offline behavior; naive sync without idempotency is a known data-loss source.

- **Name**: Idempotent replay via client-generated keys
  Pattern: client-generated idempotency keys make retried offline writes safe (no duplicates on reconnect).
  When it applies: message send + any mutation that may be retried.
  Cited example: Stripe's idempotency-key API is the reference; StudyHall's locked `POST /api/messages` idempotency_key follows it.

- **Name**: CRDT vs. OT vs. LWW selection
  Pattern: append-only chat needs only ordering + LWW; rich concurrent editing needs CRDT/OT — choosing the heavy tool for the light job is wasteful.
  When it applies: any concurrent-state design decision.
  Cited example: Figma uses OT-like multiplayer for canvas; chat apps use ordered LWW — matching tool to problem.

- **Name**: Ephemeral presence separate from durable state
  Pattern: presence/typing/read-state is high-churn and ephemeral; keep it off the primary DB (separate channel/namespace).
  When it applies: presence + typing indicators (StudyHall's `/presence` namespace).
  Cited example: Slack/Discord run presence on dedicated realtime infra, not the message store.

- **Name**: Consumerized bottom-up edtech adoption
  Pattern: edtech that lasts enters via students/teachers directly, free, then institutions follow.
  When it applies: adoption/GTM and onboarding-friction decisions.
  Cited example: Quizlet, Kahoot, Notion — student-led spread preceded institutional deals.

- **Name**: The LMS-integration trap
  Pattern: building institution-grade SSO/SIS/procurement integration early starves the product and slows iteration.
  When it applies: any pull of compliance/integration scope into H1.
  Cited example: edtech tools that prioritized district integration over end-user value and stalled.

- **Name**: Community cold-start via density
  Pattern: communication products are worthless empty; seed whole cohorts, not individuals.
  When it applies: launch-scope and onboarding decisions.
  Cited example: Slack seeds whole teams; Discord whole communities — never lone users.

- **Name**: Moderation + safety as a primitive, not an afterthought
  Pattern: student/minor communities need roles, reporting, blocking, and owner controls from early on.
  When it applies: community-feature scope and any minor-facing surface.
  Cited example: every durable social/community product (Discord Trust & Safety, Reddit mod tools) built these in; gaps cause real harm and platform risk.

- **Name**: Privacy posture as a contrast axis
  Pattern: against ad-funded incumbents, a credible privacy/data-control posture is an industry-recognized differentiator.
  When it applies: data-retention and privacy-control decisions.
  Cited example: Telegram/Signal vs. ad-driven messaging.

- **Name**: PWA / web-first desktop delivery before native wrapper
  Pattern: ship installable web first; add Electron/Tauri only when a desktop-only capability demands it.
  When it applies: desktop-delivery and packaging decisions.
  Cited example: many comms tools shipped web-first and wrapped later (Slack, Discord web clients) to avoid premature native cost.

## §4 FAILURE MODES THIS LENS CATCHES

- **Name**: Reinventing a solved sync primitive
  Pattern: a bespoke offline-sync design ignoring the outbox + idempotency + reconciliation canon.
  Why other lenses miss it: risk-officer checks it's buildable, not that a proven shape already exists.
  Cost when it lands: silent data loss / duplicate messages on reconnect — the exact failure local-first patterns prevent.
  industry-expert's catch: offline-first conformance + idempotent-replay patterns flag the deviation.

- **Name**: Over-engineering conflict resolution
  Pattern: adopting CRDTs/OT for append-only chat that only needs ordering + LWW.
  Why other lenses miss it: it looks technically sophisticated, so it reads as rigor.
  Cost when it lands: large complexity/maintenance burden for no user benefit; slows the MVP.
  industry-expert's catch: CRDT-vs-OT-vs-LWW selection pattern flags tool/problem mismatch.

- **Name**: Moderation gap in a student community
  Pattern: shipping servers/channels with no reporting/blocking/role controls.
  Why other lenses miss it: user-advocate focuses on the happy-path UX; the gap is invisible until abuse occurs.
  Cost when it lands: harassment incidents, trust collapse, platform/legal exposure with a minor audience.
  industry-expert's catch: moderation-as-primitive pattern flags the missing safety layer.

- **Name**: LMS/institution-trap creep
  Pattern: SSO/SIS/procurement features pulled forward to "look enterprise-ready."
  Why other lenses miss it: those features read as "valuable" and "standard."
  Cost when it lands: months of plumbing while end-user PMF stays untested — a documented edtech killer.
  industry-expert's catch: LMS-trap + consumerized-adoption patterns flag premature institution scope.

- **Name**: Presence persisted to the primary store
  Pattern: writing typing/presence/read-state to Postgres instead of an ephemeral channel.
  Why other lenses miss it: it "works" at one-cohort scale, so risk-officer may not flag it.
  Cost when it lands: DB write amplification and scaling pain the moment real cohorts arrive.
  industry-expert's catch: ephemeral-presence-separation pattern flags the architecture smell.

- **Name**: Fighting the SDK's grain
  Pattern: rebuilding what LiveKit/SuperTokens already provide, or using them against their intended pattern.
  Why other lenses miss it: it can look like "control" or "flexibility."
  Cost when it lands: brittle integration, lost upstream fixes, security gaps (e.g., DIY auth around SuperTokens).
  industry-expert's catch: SDK-convention-alignment dimension flags the anti-pattern.

- **Name**: Empty-product cold-start
  Pattern: optimizing acquisition before density; users land in empty servers.
  Why other lenses miss it: growth framing makes acquisition look like the priority.
  Cost when it lands: churn — communication products are worthless empty.
  industry-expert's catch: density-first cold-start pattern flags the sequencing error.

- **Name**: Mis-staged compliance (both directions)
  Pattern: ignoring FERPA/COPPA once real minors onboard, OR over-building compliance pre-users.
  Why other lenses miss it: compliance feels like a binary "later" toggle to non-specialist seats.
  Cost when it lands: legal exposure with minors, or wasted pre-PMF effort.
  industry-expert's catch: compliance-staging dimension flags mismatch between scope and actual audience.

## §5 HARD-STOP TRIGGERS

- **Trigger**: A decision onboards real students/minors while student-data compliance (FERPA/COPPA) handling is undefined.
  Why human-required: regulatory exposure with minors is a legal/founder call, not a BOARD default.
  Cited precedent: edtech products fined/forced to remediate after collecting minor data without COPPA handling.

- **Trigger**: A messaging/sync architecture choice that risks message loss or duplication with no idempotency/reconciliation story.
  Why human-required: data-integrity loss in the core comms loop is product-defining and hard to walk back.
  Cited precedent: sync systems that shipped without idempotency and corrupted/duplicated user data on reconnect.

- **Trigger**: Shipping a public/community surface to real users with no moderation/reporting primitives.
  Why human-required: safety exposure for a student/minor audience is a human/legal judgment.
  Cited precedent: community platforms that faced abuse incidents and regulatory scrutiny for missing safety tooling.

- **Trigger**: Adopting an SDK/architecture in a way that contradicts the vendor's security model (e.g., DIY around SuperTokens session/auth).
  Why human-required: auth/security deviations have outsized blast radius and need explicit sign-off.
  Cited precedent: breaches traced to hand-rolled auth bypassing a hardened provider's model.

- **Trigger**: A novel decision with NO industry prior art that nonetheless locks the product's core data/identity model.
  Why human-required: genuinely unprecedented, irreversible core-model commitments exceed pattern-matching authority.
  Cited precedent: bespoke identity/data models that became multi-year constraints.

## §6 NAMED EVIDENCE LIBRARY

- **Case**: Discord — server/channel/role + persistent voice
  Decision: build a server/channel/role community model with always-on voice rooms.
  Outcome: the de facto student-community standard.
  Lesson: the convergent community model + drop-in voice is the benchmark StudyHall should match, then differentiate.

- **Case**: Microsoft Teams — academics + FERPA, no community/offline
  Decision: enterprise/education tooling + compliance, meeting-centric, no community model, no offline-first.
  Outcome: owns institutional academics but feels heavy for student community.
  Lesson: compliance/academics without a community model or offline is exactly StudyHall's attack surface.

- **Case**: Stripe — idempotency-key API
  Decision: client-generated idempotency keys make retried writes safe.
  Outcome: industry-standard pattern for safe retries.
  Lesson: idempotent replay is the proven primitive for StudyHall's offline outbox.

- **Case**: Ink & Switch — local-first software
  Decision: articulate the local-first canon (local store, sync, conflict reconciliation).
  Outcome: the reference framework for offline-first apps.
  Lesson: offline-first has a known-good shape; deviate only with reason.

- **Case**: Figma — multiplayer / OT-style canvas
  Decision: real-time concurrent editing with OT-like resolution where genuinely needed.
  Outcome: a defensible real-time moat.
  Lesson: match conflict-resolution heaviness to the data — heavy for canvas, light for chat.

- **Case**: Linear — optimistic local writes + sync
  Decision: instant local mutations with background sync.
  Outcome: a "fast, works-offline" feel users love.
  Lesson: optimistic-local + outbox is the pattern for snappy offline UX.

- **Case**: Slack — presence on dedicated realtime infra
  Decision: keep presence/typing ephemeral and off the primary store.
  Outcome: scalable presence.
  Lesson: separate ephemeral presence from durable data (StudyHall's `/presence` namespace).

- **Case**: Telegram — privacy posture + low-bandwidth dominance
  Decision: lead on privacy/control and lightweight low-bandwidth clients.
  Outcome: huge organic adoption in unreliable-connectivity markets.
  Lesson: privacy + low-bandwidth resilience are recognized differentiators (StudyHall's offline/privacy axes).

- **Case**: Quizlet / Kahoot — consumerized bottom-up edtech
  Decision: free, student/teacher-led adoption before institutional sales.
  Outcome: massive organic reach; institutions followed.
  Lesson: bottom-up adoption precedes institutional motion.

- **Case**: Edmodo — institution-distribution edtech
  Decision: scale via institutional distribution without durable end-user retention.
  Outcome: shut down despite scale.
  Lesson: the LMS/institution trap is fatal pre-PMF.

- **Case**: Discord Trust & Safety / Reddit mod tools — moderation as primitive
  Decision: build roles, reporting, blocking, and mod tooling into the platform.
  Outcome: sustainable communities at scale.
  Lesson: moderation is a primitive for student/minor communities, not an afterthought.

- **Case**: Gather — novel spatial presence, mis-fit to students
  Decision: spatial-video presence, priced/positioned away from students, pivoting to enterprise.
  Outcome: declining student relevance.
  Lesson: novelty without segment/pricing fit doesn't hold a market.
