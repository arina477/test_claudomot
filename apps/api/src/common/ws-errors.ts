/**
 * Canonical generic error string for WebSocket unknown-error / DB-cast-failure
 * rejection paths.
 *
 * Use this constant wherever a catch{} block must send a non-leaking generic
 * message to the client for an unexpected / unclassified error.  Do NOT use it
 * for authz-denial strings ("Forbidden: …") or payload-validation strings
 * ("Invalid payload: …") — those remain literal and intentionally distinct.
 *
 * The single definition here is the authoritative source; callers import the
 * constant rather than repeating a string literal so typos and future wording
 * changes propagate automatically.
 */

export const WS_GENERIC_ERROR = 'Something went wrong';
