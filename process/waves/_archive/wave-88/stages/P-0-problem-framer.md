```yaml
verdict: PROCEED
verdict_source: problem-framer
matched_antipatterns: []
reasoning: |
  Premise RE-VERIFIED against live code and confirmed LIVE (not self-healed like
  the prior 4 seeds). DmService.sendMessage (apps/api/src/dm/dm.service.ts lines
  648-664) persists `sender_key_ref: input.senderKeyRef` verbatim with NO server-
  side validation against the author's registered public key. The fix is genuine
  defense-in-depth (public-material-only; does not break server-blindness) AND —
  critically — the key model CANNOT trigger the over-strict-post-rotation
  antipattern, because the registry holds exactly ONE active key per user
  (UNIQUE(user_id), rotation = upsert-replace), so "the author's current
  registered key" is unambiguous and single-valued. No symptom-vs-cause,
  wrong-layer, or cargo-cult match. Framing is sound. One scope constraint the
  spec MUST carry (below) to keep the check from breaking legitimate sends.
proposed_reframe: |
  n/a (PROCEED)
escalation_reason: |
  n/a (PROCEED)
sibling_visible: false
```

---

# P-0 problem-framer — wave-88 (seed task 1f48f4db)

## Symptom-vs-cause check (MANDATORY)

Not a reported defect — the seed is a proactive hardening addition. There is no
user-visible bug being papered over. The "cause" (server accepts an unvalidated
`senderKeyRef`) and the proposed fix (validate it on the send path) sit at the
SAME layer (dm.service send seam). No layer mismatch. Pass.

## Premise re-verification (PRODUCT rule 1 — last 4 seeds evaporated)

**The gap is LIVE. Confirmed in code, not stale.**

- **Send path — no validation.** `apps/api/src/dm/dm.service.ts` `sendMessage()`,
  encrypted branch (lines 648–664):
  ```ts
  const isEncrypted = input.ciphertext !== undefined;
  const insertValues = isEncrypted
    ? { …, sender_key_ref: input.senderKeyRef, envelope_version: input.envelopeVersion, … }
    : { … };
  ```
  `input.senderKeyRef` is written straight through. Zod (`SendDmMessageSchema`,
  packages/shared/src/dm.ts lines 126–173) enforces only XOR(content, envelope)
  + envelope-completeness + length bounds (`senderKeyRef: z.string().min(1).max(2000)`).
  **No comparison against the author's registered key anywhere on the server.**

- **Client already fails closed** (recipient side). `dm-crypto.ts decryptMessage`
  (lines 172–206) derives the shared secret from the author's SERVER-registered
  key resolved by `authorId`, and rejects a present-but-mismatched
  `envelopeSenderKeyRef` (`… !== authorPublicKeyBase64 → { ok: false }`).
  `useDmEncryption.ts` reinforces this (peer-key cache keyed by authorId, never
  the envelope's self-asserted ref). The recipient is ALREADY protected — which
  is why the seed is correctly rated LOW / defense-in-depth / non-blocking.

## Fix-correctness + server-blindness

**Safe re: server-blindness — confirmed.** `senderKeyRef` IS the sender's own
base64 SPKI PUBLIC key (`dm-crypto.ts` line 146: `senderKeyRef: myPublicKeyBase64`),
and `EncryptionKeyService.getKeyFor` returns the registered `public_key` (public
material). The proposed check is `senderKeyRef === registered public_key` — a
comparison of two PUBLIC strings in the same domain. The server touches no
plaintext, no private key, no ciphertext interior. Server-blind model intact.

**Additive, not redundant.** The client check protects the RECIPIENT at decrypt
time. A server check protects at INGEST time: it prevents a malformed/spoofed
`senderKeyRef` from ever being persisted and keeps the stored envelope self-
consistent. Different layer, different actor → genuinely additive, not cargo-cult.

## Key-rotation edge case (the risk the seed flagged)

**The over-strict-post-rotation antipattern CANNOT fire here — verified by schema.**

`user_encryption_keys` (drizzle/migrations/0031_wave79_user_encryption_keys.sql)
has `UNIQUE(user_id)`, and `EncryptionKeyService.upsertKey` rotates via
`ON CONFLICT (user_id) DO UPDATE` — it REPLACES the single row. There is **no
multi-key history**: a user has at most one currently-valid registered public
key at any instant. So "the author's current registered key" is single-valued;
the check needs no "any-of-N-valid-keys" allowance because N is always 1.

The system ALREADY has an inherent rotation property independent of this wave:
after a user rotates, old envelopes they sent (bearing the OLD `senderKeyRef`)
already fail to decrypt for recipients, because the recipient derives against the
NEW registered key. A server-side equality check on SEND introduces NO NEW
rotation breakage — it only affects the send happening NOW, whose `senderKeyRef`
the honest client sets from the SAME key it just registered.

**Load-bearing constraints the spec MUST carry (P-2), else the check WILL break
legitimate sends:**

1. **Validate on WRITE only, never retroactively.** Compare `senderKeyRef` to the
   author's registered key at send-time only. Never re-validate stored rows on
   read/list — their `senderKeyRef` is historical fact and a later rotation would
   make a retroactive check reject valid history. listMessages / listConversations
   MUST stay untouched.

2. **Fail OPEN when the author has NO registered key.** The plaintext/keyless-peer
   fallback (content set, envelope absent) never reaches this check. Guard the
   encrypted branch: if `getKeyFor(callerId)` returns null (key not yet registered
   / transient registry miss), do NOT hard-reject — the existing contract already
   tolerates keyless senders and registration is best-effort in useDmEncryption.
   Reject ONLY on a definite mismatch (registered key present AND differs). This
   keeps the register-then-send race from producing false 4xx rejections.

3. **Scope: 1:1 encrypted send only. No new config knob.** No change to group DMs
   (plaintext today), no change to who_can_dm / block seams. Make the check
   unconditional — no feature flag (no second consumer; antipattern #6 avoided).

## Antipatterns checked

- #1 symptom-vs-cause: n/a (not a defect). Pass.
- #2 wrong-layer: no — fix is at the send seam where the gap is. Pass.
- #3 demo-path tunnel vision: rotation + keyless-sender edges are the ones to
  watch; enumerated above as P-2 spec constraints. Fix LOCATION is right, so this
  is spec detail (P-2 owns it), not a mis-framing → not a REFRAME. Pass.
- #6 configuration drift: flag the risk of a needless feature flag; P-2 hard-codes
  unconditional. Not itself a REFRAME trigger.
- #7 validation theater: NOT theater — validates untrusted client input at a real
  system boundary (the write seam). Legitimate. Pass.

## Disposition

**PROCEED** to P-1. Framing is sound: the gap is live, the fix is server-blind-safe
(public material only), and the rotation edge is neutralized by the single-active-
key schema. Carry the three write-only / fail-open / no-flag constraints into the
P-2 spec so the check does not over-reject legitimate sends.
