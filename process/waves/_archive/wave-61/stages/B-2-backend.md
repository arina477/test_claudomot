# B-2 Backend — wave-61
Specialist: backend-developer (aad9a302d70dd0fd7). apps/api/src/dm/dm.controller.ts:
- import Throttle from '@nestjs/throttler'
- @Throttle({default:{limit:60,ttl:60_000}}) on the 3 DM READ handlers (listConversations ~:93, listMessages ~:141, getDmCandidates ~:182). Constant is 60 (NOT 120). Justifying comment added.
- POST/write handlers (createConversation, sendMessage) UNTOUCHED (keep global 10/60s). No @SkipThrottle.
Results: tsc clean; biome clean; dm.service.spec 26/26. dm tests are service-level (can't assert route throttle) → T-8 live-verifies. Deviation: none.
```yaml
files: [apps/api/src/dm/dm.controller.ts]
deviations: []
commit: 3771e5c
```
