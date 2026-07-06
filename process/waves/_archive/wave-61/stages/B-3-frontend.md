# B-3 Frontend — wave-61
Specialist: react-specialist (a774a05fa8262fc50).
- apps/web/src/auth/retryOn429.ts (new): bounded exp backoff (base 300ms ×2, cap 10s, max 4 attempts), honors Retry-After (max(backoff,retryAfterMs)); rethrows after exhaustion.
- apps/web/src/auth/api.ts: added HttpError (extends Error; status + retryAfterMs) + parseRetryAfterMs; request()/requestNoContent() throw HttpError on 429 (identical behavior for non-429); wrapped ONLY the 3 DM READ calls (listDmConversations, listDmMessages, getDmCandidates) with retryOn429.
- apps/web/src/auth/retryOn429.test.ts (new): 10 tests (429→retry→success; exhaust→throw; Retry-After honored; non-429→immediate throw; writes not wrapped).
WRITES NOT retried (sendDmMessage/createDmConversation call request() directly, no wrapper). Deviation: none (HttpError subclass is a minor type-safety improvement over attaching ad-hoc props).
```yaml
files: [apps/web/src/auth/retryOn429.ts, apps/web/src/auth/api.ts, apps/web/src/auth/retryOn429.test.ts]
deviations: []
commit: 7b8c923
```
