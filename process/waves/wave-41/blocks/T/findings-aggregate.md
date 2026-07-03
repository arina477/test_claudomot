# Wave 41 — T-block findings aggregate

## T-5/T-6 + T-8
- T-8 (moderation authz) ALL PASS, 0 findings: non-mod 403, educator timeout, mute-gate BOTH createMessage+createReply, delete-any rank guard (owner protected), timeout rank guard (owner/self), no IDOR/leak, secret-grep clean.
- T-5/T-6 PASS: role toggle, timeout UI flow + muted indicator, non-mod indicator-only, keyboard, layout. LOW: (a) muted icon right-edge padding (cosmetic); (b) delete-any UI deferred (backend proven T-8). LOW/infra: 1 throwaway test server persists (no server DELETE endpoint — pre-existing).
