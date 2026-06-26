# Microsoft Teams (for Education)

**First seen:** 2026-06-26 (v2 onboarding scan)
**Tier:** 1 — Primary benchmark (match-or-beat, academic-tooling dimension)
**Evidence quality:** DIRECT_OBSERVATION (WebFetch of microsoft.com/education, learn.microsoft.com, support.microsoft.com) + HELP_ARTICLE. No live screenshots — agent lacks Playwright.

**URL:** https://www.microsoft.com/en-us/education/products/teams
**Category overlap with us:** High on academic tools (Assignments, Gradebook, Class Notebook, scheduling), but UX/target/channel model diverge — Teams is institution-administered, meeting-centric, enterprise-UX, not student-community-centric.
**Business model:** Institutional licensing bundled with Microsoft 365 Education. A1 free to qualifying schools (institutional email); A3/A5 (~$2.50–$8/user/mo) add desktop Office, compliance, AI. Revenue via school/district agreements, not per-student.

## Key UX patterns
1. **"Class Team" template** = structural unit; distinct teacher/student permissions, tabs for Assignments/Grades/Class Notebook/Files. **Students cannot self-create class teams** — educator/IT provisions them. Top-down IA: strong for formal coursework, hostile to informal peer study groups. [DIRECT_OBSERVATION]
2. **Deep native Assignments**: rubrics, distribute/collect/annotate/grade/return; 2026 adds AI rubrics, standards tagging, 100+ language auto-translation, standalone Assignments app (premium A3/A5). [DIRECT_OBSERVATION]
3. **Meeting-centric voice/video** — no persistent voice channels; all audio/video is through scheduled meetings. Fundamental paradigm difference from Discord and StudyHall's drop-in model. [HELP_ARTICLE]
4. **Offline = workaround, not design**: OneDrive file sync + 24h chat queue + offline OneNote authoring, but MS guidance for low bandwidth is literally "avoid live video, use pre-recorded / flipped classroom." [DIRECT_OBSERVATION]
5. Limits: 300 participants/meeting (A1), 1000 members/class team, 30h meeting cap, 20-day recording retention. Chat-initiated calls cap at 20. [DIRECT_OBSERVATION]

## Pricing
A1 free for qualifying schools (web Office, Teams, OneDrive, Assignments, Class Notebook ≤300, meetings ≤300). A3/A5 institutional for desktop Office + AI + compliance. Requires active MS Education agreement; no self-signup.

## Strengths
- **Deepest native academic tooling** of any comms platform (Assignments, Gradebook, rubrics, Class Notebook, Reading Progress, Reflect) — no bots.
- **FERPA-compliant by contractual designation** ("school official"), no ad use of student data; COPPA/GDPR/ISO 27001. Legally meaningful for US institutions.
- Embedded in school IT (OneNote/SharePoint/OneDrive/Outlook); generous 300-person free meetings; strong accessibility; substantial 2026 AI roadmap.

## Weaknesses / where StudyHall wins
- **Offline is a workaround narrative** — MS docs admit the platform doesn't work for real-time collaboration on poor connections. No offline-first architecture.
- **Zero student-community model** — no server analogue, no drop-in voice room, no peer discovery; every space needs institutional provisioning.
- Enterprise UX friction; **no persistent voice channels**; students locked to institutional identity (graduation/transfer = hard wall); student-side privacy controls absent (institution controls data, not student); requires IT admin (barrier in under-resourced regions).

## Voice/video
Meetings up to 300 (A1) / 1000 (A3/A5), 1080p, breakout rooms, transcription, recording (20d). No persistent voice rooms; chat calls cap at 20. Low-bandwidth strategy = turn off cameras.

## Evidence sources
- https://www.microsoft.com/en-us/education/products/teams
- https://support.microsoft.com/en-us/education/use-teams-for-schoolwork-when-bandwidth-is-low
- https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams
- https://learn.microsoft.com/en-us/compliance/regulatory/offering-ferpa
- https://windowsnews.ai/article/microsoft-teams-for-education-2026-ai-rules-rubrics-standards-better-feedback.425257

## Tier rationale
**Tier 1.** Owns the academic-tools dimension and FERPA credibility StudyHall must credibly match to be taken seriously for coursework; its enterprise UX, no-community-model, no-offline-first, and provisioning barriers are structural gaps a student-native approach can own.
