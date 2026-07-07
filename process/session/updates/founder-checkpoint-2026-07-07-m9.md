# Founder checkpoint — M9 Monetization (non-blocking, surfaced at wave-74 P-0)

The engine has started monetization (M9) with the piece that needs zero input from you: the tier/entitlements plumbing (every server defaults to "free"; nothing is charged yet). To turn on ACTUAL paid tiers in the NEXT slice, two things are yours to decide — answering now lets the engine build the revenue slice immediately after with no wait:

1. **Stripe account + API keys.** Taking payments needs a Stripe account (yours, on your billing) and its API keys pasted to the engine (never committed — lives only in the deploy environment). ~3 min: railway-style — create a Stripe account, grab the secret key + a webhook signing secret.
2. **Tier design + pricing + success metric.** What are the paid tiers actually called + priced, what does each unlock (storage, call capacity, educator admin tools), and how will we know monetization "worked" (M9 has no success metric set yet — e.g. "N paying servers in 90 days")? These are money/product calls reserved to you.

Neither blocks the current substrate wave. Reply whenever; the answer unblocks the real-charging slice.
