# Founder checkpoint items — 2026-07-07 (non-blocking; loop continues on safe defaults)

## M10 Compliance — 2 items to confirm when you have a moment (not blocking wave-72)
1. **Account-deletion behavior (compliance regime).** wave-72 is building "Delete my account." It defaults to a SOFT delete: your account becomes inaccessible, your personal info is scrubbed, and your sessions are revoked — reversible + audit-friendly (good for school/institution credibility). The stricter alternative is a HARD delete (permanently purge everything, GDPR/CCPA-style). We're shipping the soft-delete default now; if you want the hard-delete (irreversible purge) posture instead, say so and we'll add it. This choice shapes later compliance work (audit log, consent).
2. **M10 success metric.** M10 (Compliance & data rights) has no success metric set yet. What does "done well" look like to you (e.g. "a user can export + delete their data end-to-end", or a specific FERPA/COPPA/GDPR posture)? Not needed to start, but needed before M10 wraps.

(Loop continues on the safe soft-delete default; answer via chat anytime.)
