# P-2 — Spec (wave-56) — POINTER
SoT: tasks.description of c5051444. wave_type single-spec; claimed [c5051444]; design_gap_flag false.
Scope: add a defensive server-side `.limit(DM_CANDIDATES_LIMIT)` (generous cap ~500) to getDmCandidates (dm.service.ts:694-711, after orderBy) so the query is bounded. MVP-scale behavior unchanged. No cursor/pagination/UX (deferred 999a14d1), no privacy/DTO/schema change. Test proves the bound (mechanism = B-block's feasible honest choice, since CAP+1 fixtures may be impractical for a large CAP).
