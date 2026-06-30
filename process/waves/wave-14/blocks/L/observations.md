# Wave-14 — L-block observations (T-block-sourced; L-2 distill candidates)

Recorded by head-tester at T-9 end-of-life. NOT promoted to principles (L-2 + karen own promotion; cap 1/wave/file; needs 2+-wave recurrence). These capture rejected approaches + layer-discipline reasoning.

## T-8 / T-5 — two-client realtime requires DISTINCT verified users, not multi-tab
- For PRESENCE fan-out specifically, two sockets of the SAME user CANNOT prove co-member fan-out: presence:online uses socket.to() (excludes origin) + fires only on 0→1, so a 2nd same-user socket gets nothing (that IS multi-tab no-flap, a different AC). A genuine "B sees A online" proof needs a second distinct verified account that shares a server.
- Rejected approach: treating same-user-two-tabs as the two-client proof (would have passed vacuously while proving nothing about cross-user delivery).
- Provisioning path that worked: signup 2nd account → email-verify via SuperTokens Core admin API (temp Railway public domain on the Core service via project token `APP_RAILWAY_TOKEN` → generate+consume verify token → delete domain + remove PORT var) → join shared server via invite. Recorded both fixtures in test-accounts.md.
- Candidate principle (T-8 / test-writing-principles §): "Two-client realtime proof for presence/typing fan-out requires two DISTINCT verified users sharing a scope; same-user multi-tab proves only ref-count no-flap." (recurrence check: wave-12/13 messaging two-client used the same need.)

## T-8 — wire-level socket.io probe beats DOM observation for realtime correctness; caught F-4 that unit + DOM both missed
- F-4 (typing structurally non-functional) was invisible to: (a) the unit test (getTypers tested in isolation = correct), (b) DOM E2E (the panel renders; "page works"). Only a two-client WIRE assertion on the actual typing:active PAYLOAD ("does B's typers list contain A?") exposed it.
- Rejected approach: asserting only that typing:active was RECEIVED (it was) — must assert the payload CONTENTS (the typer is present), not mere delivery.
- Candidate principle: "For room-broadcast realtime, assert the PAYLOAD a co-member receives contains the expected actor/data — not merely that an event arrived; a single room-wide broadcast with a per-actor exclude silently empties the payload for everyone."

## T-3/T-4 — library packages need spec exclusion from tsc build
- Adding the first *.spec.ts to packages/shared broke `tsc --build` (specs compiled into dist + typechecked under noUncheckedIndexedAccess). Fix: exclude **/*.spec.ts from the build tsconfig (specs never ship in lib dist) + null-safe assertions (optional chaining, NO ts-bypasses). vitest discovers specs independently via its own config.
- Candidate principle (T-3): "When wiring tests into a tsc-built library package, exclude spec globs from the build tsconfig so specs never enter dist or the build typecheck."
