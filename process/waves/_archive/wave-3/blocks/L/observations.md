# Wave 3 — L-2 Distill Observations

Synthesized from wave-3 artifacts (auth + profile frontend; M1 auth frontend shipped live on Railway).
Artifact range: P-0 through V-3, PRs #5–#9, merge commits b3efa82 / 04244de.
Prior archive consulted: process/waves/_archive/wave-1/blocks/L/observations.md.

```yaml
observations:

  - id: obs-1
    summary: >
      A Vite build-time env var (VITE_API_ORIGIN) that controls the SPA's API host
      was not declared as a Docker ARG/ENV before `pnpm build`, so the prod container
      baked the fallback (window.location.origin) into the bundle; every browser auth
      flow silently targeted the wrong host. Local dev and CI both passed because they
      source a .env file that is absent in the container build context. This is the
      third consecutive wave to ship a deploy-config defect that is invisible until
      a prod-container boot.
    source:
      - process/waves/wave-3/stages/V-1-jenny.md  # C1 finding: bundle had 0 hits for api-production domain; apps/web/Dockerfile had no ARG/ENV VITE_API_ORIGIN before pnpm build
      - process/waves/wave-3/stages/V-2-triage.md  # bucket: blocking; RESOLVED PR#9
      - process/waves/wave-3/stages/V-3-fast-fix.md  # 5 defects caught+fixed in-wave; C1 was the first critical
      - process/waves/_archive/wave-1/blocks/L/observations.md  # obs-2: tsconfig outDir trap passes CI, breaks prod start
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      wave-1 obs-2 (NestJS tsconfig outDir emits to dist/src/main.js, prod boot breaks, CI green).
      Wave-2 checklist note references entrypoint + SuperTokens init-ordering deploy failures (transcripts
      lost; pattern asserted in wave-3 checklist). Three-wave streak: the mechanism differs each time
      (outDir, import-ordering, Dockerfile ARG) but the failure class is identical — CI green,
      prod-container first boot breaks on a deploy-config omission.
    promotion_gates:
      generalizable: true   # any Vite SPA in a Docker monorepo using build-time env vars
      falsifiable: true     # checkable: grep Dockerfile for ARG declarations before any RUN pnpm build
      cited: true           # wave-1 obs-2 + wave-3 jenny C1 finding

  - id: obs-2
    summary: >
      A monorepo workspace package whose package.json `exports` / `main` / `types` fields
      point at `src/` source files resolves correctly under ts-node / Jest (which transpile
      on demand) but fails at prod-container boot when the Node process loads the built
      `dist/` output and cannot resolve the untranspiled import. The defect passes every
      local-dev and CI path that never cold-starts the built container.
    source:
      - process/waves/wave-3/stages/V-1-karen.md  # F4 item 1: packages/shared/package.json main/types/exports verified pointing dist/ post PR#6
      - process/waves/wave-3/stages/V-2-triage.md  # PR#6 (shared-pkg exports src→dist) in blocking bucket
      - process/waves/wave-3/stages/C-2-deploy-and-verify.md  # ERR_MODULE_NOT_FOUND resolved at deploy
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      Mechanically distinct from wave-1 obs-2 (that was tsconfig outDir; this is package.json exports),
      but the failure class is the same: a workspace-resolution path that is valid under the TypeScript
      toolchain diverges from what Node resolves at runtime in the built container. Both are
      prod-container first-boot failures invisible to CI.

  - id: obs-3
    summary: >
      A cross-origin SPA-to-API auth flow using SuperTokens cookie mode requires three
      coordinated settings to work in a browser: SameSite=None;Secure on the session cookies,
      Access-Control-Allow-Origin set to the exact web origin (not wildcard), and
      Access-Control-Allow-Credentials:true. Omitting any one silently drops the cookie or
      the credentialed request; the backend returns correct JSON when curled directly, making
      the defect invisible to server-side and CI checks.
    source:
      - process/waves/wave-3/stages/V-1-jenny.md  # SameSite=Lax drop finding + CORS corollary I1; post-PR#9 re-verify confirms all three settings present
      - process/waves/wave-3/stages/T-8-security.md  # csrf_results: SameSite=Lax cookies noted pre-fix; session probe results
      - process/waves/wave-3/stages/V-2-triage.md  # cross-origin SameSite=Lax cookie drop: blocking, RESOLVED PR#9
      - process/waves/wave-3/stages/P-3-plan.md  # B-4: "CORS already allows web origin (wave-2). Confirm cookie-based session across origins." — plan noted risk but did not fully specify the SameSite+credentials triplet
    severity: strong
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First wave this specific cross-origin cookie pattern appears; wave-2 checklist cites
      SuperTokens-related deploy issues but transcripts are lost so direct link cannot be confirmed.
      Pattern is architecturally novel to this project at wave-3; promote only if it recurs.

  - id: obs-4
    summary: >
      A NestJS global exception filter that wraps SuperTokens middleware must guard
      `res.headersSent` before writing its own response; when SuperTokens has already
      committed the response bytes for a session error, re-entering the filter with
      `res.status(...).json(...)` causes ERR_HTTP_HEADERS_SENT, crashing the Node process
      and surfacing as a sustained 502 for all subsequent requests.
    source:
      - process/waves/wave-3/stages/T-8-security.md  # LOW finding: csrf-rejected PATCH → 502; fix_up_cycles: 1; PR#7/#8 + eed4c3c
      - process/waves/wave-3/stages/V-1-jenny.md  # api sustained 502 spree traced to exception-filter crash-loop; post-PR#9 confirms stable (/health 200 through CSRF-reject)
      - process/waves/wave-3/stages/V-2-triage.md  # exception-filter crash-loop: blocking, RESOLVED PR#9
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First occurrence. Wave-2 checklist cites SuperTokens init-ordering issues; a headersSent
      guard is a distinct failure mode. Hold in observations — promote if a SuperTokens filter
      re-integration issue recurs in a later wave.

  - id: obs-5
    summary: >
      A direct push to the default branch (bypassing a pull request) on a security-surface
      file (auth exception filter) left no CI gate, no diff review record, and no merge
      commit trail. The project's Railway CI pipeline does not trigger on direct pushes the
      same way as PRs; branch protection was not enabled on main. This occurred once but on
      a file that handles session error responses.
    source:
      - process/waves/wave-3/stages/V-1-karen.md  # PROCESS-1: commit eed4c3c direct-pushed; gh pr list --search eed4c3c returns []
      - process/waves/wave-3/stages/V-2-triage.md  # direct-push eed4c3c bypassed PR: non-blocking flag → L-2/retro
      - process/waves/wave-3/stages/V-3-fast-fix.md  # flag → L: PROCESS-1 eed4c3c direct-pushed, recommend branch protection
    severity: warning
    candidate_principles_file: command-center/principles/CI-PRINCIPLES.md
    recurrence: >
      First documented occurrence. No prior wave artifact records a direct-push event.
      Hold in observations; promote to CI-PRINCIPLES if branch-protection is still absent
      at the next wave's C-1 or a second direct-push recurs.
    promotion_gates:
      generalizable: true   # any solo-dev Railway repo without branch protection rules
      falsifiable: true     # checkable: gh api repos/{owner}/{repo}/branches/main/protection
      cited: true           # karen PROCESS-1 + V-2 triage + V-3 flag

  - id: obs-6
    summary: >
      A NestJS controller that dynamically imports an exception class via
      `await import('@nestjs/common')` inside a request handler receives a module reference
      whose constructor is not the same identity as the statically-loaded class; the
      resulting instance fails `instanceof HttpException` in the global exception filter,
      causing the request to crash with a 502 instead of a clean 4xx. Static top-of-file
      imports are required for any class whose instanceof identity must survive the
      exception-filter boundary.
    source:
      - process/waves/wave-3/stages/T-8-security.md  # HIGH finding: PATCH /profile invalid input → 502; root cause dynamic await import
      - process/waves/wave-3/stages/V-1-karen.md  # F4 item 2: BadRequestException confirmed as static top-of-file import post PR#7/#8
      - process/waves/wave-3/stages/V-2-triage.md  # PATCH-validation 502: blocking, RESOLVED PR#7/#8
    severity: warning
    candidate_principles_file: command-center/principles/BUILD-PRINCIPLES.md
    recurrence: >
      First occurrence. The root cause (dynamic import breaking instanceof) is a general
      NestJS pitfall not specific to auth. Hold in observations; promote if a second
      dynamic-import instanceof failure appears in a later wave.
```
