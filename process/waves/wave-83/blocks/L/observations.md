# Wave 83 — L-block observations (seed; knowledge-synthesizer runs at L-2)

## obs-C1-direct-push (severity: strong; candidate: BUILD-PRINCIPLES)
A `git push <url> HEAD:main` issued from a feature branch to commit a process-doc to main instead pushed the branch HEAD, landing ALL feature commits on main + bypassing the required-check CI gate. Observed wave-83 C-1. Lesson: to commit a doc to main from a feature branch, switch to main first (or push an explicit single-commit ref), NEVER `HEAD:main` while a feature branch is checked out. Cited: C-1-pr-ci-merge.md. (Recurrence check at L-2 vs prior waves before any promotion.)
