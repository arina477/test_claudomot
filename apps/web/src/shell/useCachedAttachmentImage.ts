/**
 * useCachedAttachmentImage — offline-aware image src hook for message attachments.
 *
 * Online path:
 *   Returns the presigned URL as `src` immediately. Concurrently fires a
 *   best-effort write-through fetch so the blob lands in IDB while the URL is
 *   still fresh (1h TTL). The fetch is non-blocking and errors are swallowed.
 *
 * Offline / url-fetch-fail path:
 *   Returns an object-URL created from the cached blob if one exists.
 *   Returns null (caller renders placeholder) when no cached blob is available.
 *
 * OBJECT-URL LIFECYCLE: every `URL.createObjectURL` is paired with a
 * `URL.revokeObjectURL` via useEffect cleanup — on unmount and on src change.
 * No object URL leaks.
 *
 * Offline detection: determined by whether the presigned-URL fetch succeeds or
 * fails, NOT by `navigator.onLine` (mirrors the useDm / useMessages .catch model).
 *
 * wave-64 B-3 task 83aa28e4
 */

import type { AttachmentRef } from '@studyhall/shared';
import { useEffect, useRef, useState } from 'react';
import { getCachedAttachmentBlob, putCachedAttachmentBlob } from '../features/sync/cache';
import { db } from '../features/sync/db';

export type AttachmentImageState =
  /** Using the presigned URL (online, or object-URL not yet resolved). */
  | { kind: 'url'; src: string }
  /** Using a cached object-URL (offline, blob found). */
  | { kind: 'objectUrl'; src: string }
  /** No cached blob available — caller renders placeholder. */
  | { kind: 'unavailable' };

/**
 * Returns the effective image src for an AttachmentRef, handling online
 * write-through caching and offline blob-fallback with safe object-URL lifecycle.
 *
 * @param attachment - The AttachmentRef descriptor (id / url / contentType / etc.)
 * @returns AttachmentImageState — caller switches on `.kind`.
 */
export function useCachedAttachmentImage(attachment: AttachmentRef): AttachmentImageState {
  // The current object URL we own — tracked in a ref so cleanup always sees
  // the latest value without needing to re-register effects.
  const objectUrlRef = useRef<string | null>(null);

  // State: null = unresolved, string = objectUrl for offline, 'url' sentinel = use presigned
  // We use a discriminated-union state to drive renders.
  const [state, setState] = useState<AttachmentImageState>({
    kind: 'url',
    src: attachment.url,
  });

  const attachmentId = attachment.id;
  const attachmentUrl = attachment.url;

  useEffect(() => {
    // Revoke any object URL from the previous render cycle (src change).
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Always start by showing the presigned URL.
    setState({ kind: 'url', src: attachmentUrl });

    // Best-effort write-through: fetch the blob and store it in IDB.
    // On failure, try to serve from cache (offline path).
    let cancelled = false;

    fetch(attachmentUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;

        // Write-through: non-blocking, errors swallowed.
        if (db) {
          putCachedAttachmentBlob(db, {
            id: attachmentId,
            blob,
            contentType: attachment.contentType,
            filename: attachment.filename,
            sizeBytes: attachment.sizeBytes,
          }).catch(() => {
            // best-effort — swallow IDB errors
          });
        }
        // Online path: presigned URL is still valid — keep 'url' state (no change needed).
      })
      .catch(async () => {
        if (cancelled) return;
        // Offline / fetch-fail: try serving from cache.
        if (!db) {
          setState({ kind: 'unavailable' });
          return;
        }
        try {
          const cached = await getCachedAttachmentBlob(db, attachmentId);
          if (cancelled) return;
          if (cached) {
            const objUrl = URL.createObjectURL(cached.blob);
            objectUrlRef.current = objUrl;
            setState({ kind: 'objectUrl', src: objUrl });
          } else {
            setState({ kind: 'unavailable' });
          }
        } catch {
          if (!cancelled) {
            setState({ kind: 'unavailable' });
          }
        }
      });

    return () => {
      cancelled = true;
      // Revoke object URL on unmount or when attachment changes.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [
    attachmentId,
    attachmentUrl,
    attachment.contentType,
    attachment.filename,
    attachment.sizeBytes,
  ]);

  return state;
}
