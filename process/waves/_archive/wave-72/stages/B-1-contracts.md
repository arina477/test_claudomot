# Wave 72 — B-1 Contracts

## Contracts authored (task e11f8746)
- **New file:** `packages/shared/src/account-deletion.ts` — mirrors the shipped `account-data.ts` (right-to-access) sibling style.
  - `DeleteAccountRequestSchema` = `{ confirm: z.literal(true) }` — confirmation gate; absent/false → Zod parse fail → backend 400.
  - `DeleteAccountResponseSchema` = `{ status: z.literal('deleted') }` — 200 success body.
  - `DeleteAccountBlockedResponseSchema` = `{ status: z.literal('blocked'), reason: string, servers: [{id, name}] }` — 409 owner-block body (UI lists blocking servers).
  - Each schema + its `z.infer` type exported.
- **index.ts:** re-exports the three schemas + three types, `.js` extension, mirroring the AccountDataResponse export block.

## Design note
Two response schemas (not a discriminated union) — success travels on 200, block on 409; controller + web client consume them on separate HTTP paths. Matches account-data.ts (no union precedent).

## Typecheck
- `pnpm --filter @studyhall/shared typecheck` → clean (isolated; consumer breakage in api/web expected, validated at B-4).

## Fixups
- Corrected a stale comment referencing `DELETE /account` → `POST /profile/delete` (the actual endpoint).

## Deviations
- Section-header comments added (blocks.ts style) vs comment-free account-data.ts — cosmetic, justified by three distinct schemas.

```yaml
skipped: false
contracts_authored: [packages/shared/src/account-deletion.ts, packages/shared/src/index.ts]
sdk_regenerated: false
fast_path_approved: false
deviations: [section-header-comments-added]
```
