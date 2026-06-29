CONCERN: The in-memory rate-limiter is a fragile solution that only works for a single-instance deployment. This "MVP" approach creates a latent security vulnerability, as the rate-limiting will silently become ineffective upon horizontal scaling, which is a common and expected evolution for a service.

EVIDENCE: "ThrottlerModule (in-memory; ttl 60s, limit 10) in AppModule" and "(throttler store IN-MEMORY (single-pod MVP, _library L423) — NO Redis (premature))."

SUGGESTION: Either implement the rate-limiter with a scalable backend like Redis from the start, or add a prominent technical debt ticket that blocks any future horizontal scaling until this is addressed.
