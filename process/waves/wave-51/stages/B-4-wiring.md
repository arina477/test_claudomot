# B-4 — Wiring (wave-51)
- Repo-wide typecheck (`pnpm -w typecheck`): clean (all packages).
- No route registration / no new module (single-file layout conditional). No B-2↔B-3 contract surface.
```yaml
typecheck: clean
routes_registered: []
```
