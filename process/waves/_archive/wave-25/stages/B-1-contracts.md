# Wave 25 — B-1 Contracts

**Specialist:** typescript-pro. **Commit:** `1da04a6`. **Scope:** shared mention slug grammar (single source of truth).

## Delivered
- NEW `packages/shared/src/mentions.ts`:
  - `MENTION_TOKEN_SLUG_SRC = 'a-zA-Z0-9_-'` (character-class source string).
  - `MENTION_TOKEN_SLUG_RE = /^[a-zA-Z0-9_-]+$/`.
  - `extractMentionSlug(rawToken): string | null` — extracts the leading `[a-zA-Z0-9_-]+` run from a raw `@…` token (`@bob.dev`→`bob`, `@alice!`→`alice`, `@carol-X`→`carol-X`, `@`/`@.`→`null`).
  - Header comment: mention TOKEN slug is intentionally BROADER than the username validation grammar (`profile.ts:14` `/^[a-z0-9_]{3,20}$/`); a token that isn't a real username resolves to nothing (plain text).
- Barrel-exported from `packages/shared/src/index.ts` (lines 125-128).

## Binding B-1 carry honored (P-4 karen+jenny)
Export named `MENTION_TOKEN_SLUG_RE` / `MENTION_TOKEN_SLUG_SRC` — NOT "username grammar." A future dev must not tighten the mention slug to the username rule (would break hyphen/uppercase mention tokens).

## Exit
Contract locked before B-2/B-3. → B-2/B-3.
