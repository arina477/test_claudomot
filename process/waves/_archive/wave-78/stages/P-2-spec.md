# Wave 78 — P-2 Spec (pointer)

**Source of truth:** the spec contract lives in the primary task's `tasks.description` — task **4be3b084-c86f-48f6-b3fc-fe9e95d60556** (fenced YAML head + `---` + prose). This file is a convenience pointer.

- **wave_type:** multi-spec (2 blocks)
- **claimed_task_ids:** [4be3b084 (seed — academicRole clearable), 3b3530d8 (sibling — hidden-vs-transient-error on card)]
- **design_gap_flag:** false

## Acceptance criteria (copy for P-3/P-4 reference)

### Block 1 — academicRole clearable (4be3b084)
- Editor empty/unset option clears a set role on save (no longer a dead no-op).
- PATCH /profile {academicRole: null} → 200 + persists NULL; GET returns null.
- PATCH omitting academicRole → existing value unchanged (undefined ≠ null).
- PATCH academicRole '' → coerced to null → clears (200).
- PATCH academicRole non-enum non-null → 400 (enum preserved).
- 409-username + other fields unaffected.

### Block 2 — hidden vs transient error on card (3b3530d8)
- 404 → calm hidden state, NO retry, byte-identical across hidden/blocked/nonexistent.
- transport failure (network/timeout/5xx) → DISTINCT retryable error state ("could not load").
- retry re-fetches: 200 renders; repeated 404 → hidden; repeated transport fail → stays retryable.
- distinction is client-side (HttpError.status); NO new server field / no server why-oracle (uniform-404 anti-oracle preserved).

## Load-bearing (T-8): uniform-404 anti-oracle non-regression; service undefined-vs-null distinction.
