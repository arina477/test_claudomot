# wave-74 archive — recovery note (2026-07-07)
A worker restart hard-reset local `main` to origin (2cbf761), discarding the local-only
wave-74 L-2/N-block commits + the N-3 archive move. The DB is the source of truth and was
unaffected: waves row 74 = status 'ok' (ended), wave-75 running under M9, bundle correct.
This directory was re-archived after the reset. The lost L-2-distill + N-1/N-2/N-3 transcript
files are not reconstructed (pure archival artifacts; the wave's outcome is fully recorded in
the DB waves/tasks/milestones rows + product-decisions.md). Wave-74 shipped the M9 entitlements
substrate LIVE (d79dd18); 0 principles promoted at L-2 (2 held candidates in the archived
observations.md); N-1 disposition B (founder-reserved pause) resolved by the founder directive
that opened wave-75.
