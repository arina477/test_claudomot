import { z } from 'zod';

// ---------------------------------------------------------------------------
// DeleteAccountRequestSchema — confirmation gate collected by the UI before
// issuing POST /profile/delete.
//
// The confirm field must be the literal `true`; any other value (false,
// undefined, omitted) causes a Zod parse failure so the backend can return
// 400 without executing any deletion logic.
// ---------------------------------------------------------------------------

export const DeleteAccountRequestSchema = z.object({
  confirm: z.literal(true),
});
export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;

// ---------------------------------------------------------------------------
// DeleteAccountResponseSchema — 200 success body returned after the account
// has been fully deleted.
// ---------------------------------------------------------------------------

export const DeleteAccountResponseSchema = z.object({
  status: z.literal('deleted'),
});
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;

// ---------------------------------------------------------------------------
// DeleteAccountBlockedResponseSchema — 409 error body returned when the
// caller owns one or more servers that must be transferred or deleted first.
//
// `servers` lists the blocking servers so the UI can surface them by name and
// guide the user through the required pre-deletion steps.
// ---------------------------------------------------------------------------

export const DeleteAccountBlockedResponseSchema = z.object({
  status: z.literal('blocked'),
  reason: z.string(),
  servers: z.array(z.object({ id: z.string(), name: z.string() })),
});
export type DeleteAccountBlockedResponse = z.infer<typeof DeleteAccountBlockedResponseSchema>;
