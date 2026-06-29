CONCERN: The test relies on Supertokens' current lazy-initialization behavior, using a dummy, unreachable URI. This creates a brittle check that won't catch future boot failures caused by changes in the library's connection logic or invalid production configurations, undermining the goal of protecting every future deploy.

EVIDENCE: "supertokens.init registers config but connects to the core LAZILY (first SDK call) — /health is unauth + doesn't touch the SDK → a dummy SUPERTOKENS_CONNECTION_URI boots fine to /health 200."

SUGGESTION: The job should spin up a real Supertokens service container, analogous to the Postgres service, to validate the entire boot and wiring sequence against a valid configuration.
