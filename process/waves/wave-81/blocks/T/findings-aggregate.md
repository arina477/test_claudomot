# Wave 81 — T-block findings aggregate

Canonical V-2 input. Append-only as T-stages run.

| # | Severity | Stage | Surface | Description |
|---|---|---|---|---|
| 1 | low | T-2 | ProfilePage.tsx | No standalone unit asserting ProfilePage root === FullPageScroll wrapper (needs data mock); covered by SettingsPrivacyPage sibling assertion + LIVE T-5. Informational. |
| 2 | high | T-5 | PWA service worker | Stale Workbox precache (`workbox-precache-v2`) serves the OLD pre-fix bundle (index-AVNFN-ve.js, 0× h-dvh) to returning users, reproducing the founder scroll bug — even though the deploy is correct (index.html → new bundle index-R5obJ0iu.js WITH the fix). Deploy-delivery gap. Founder may re-check and still not scroll until SW updates. Route V-2: workbox skipWaiting/clientsClaim + versioned precache or reload prompt. |
