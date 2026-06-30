# Dexie + fake-indexeddb Reference

**Last verified:** 2026-06-30
**Official docs:** https://dexie.org/docs/
**GitHub:** https://github.com/dexie/Dexie.js
**Installed version:** dexie 4.0.11 · fake-indexeddb 6.0.0
**Install location:** `@studyhall/web` (apps/web)

Install commands:

```
pnpm add --filter @studyhall/web dexie
pnpm add -D --filter @studyhall/web fake-indexeddb
```

---

## Official API Surface

### Public classes / functions

#### `Dexie` (default export from `dexie`)

The core class. You subclass it once per database, declare your schema via `.version(N).stores({...})`, then export the singleton. All table access goes through typed properties on the subclass.

```ts
import Dexie, { type EntityTable } from 'dexie';

class StudyHallDB extends Dexie {
  messages!: EntityTable<CachedMessage, 'id'>;
  channels!: EntityTable<CachedChannel, 'id'>;
  outbox!:   EntityTable<OutboxItem,    'id'>;

  constructor() {
    super('studyhall');
    this.version(1).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox:   '++id, channelId, idempotencyKey, state, createdAt',
    });
  }
}

export const db = new StudyHallDB();
```

#### `EntityTable<T, PK>`

A generic type (re-exported from `dexie`) that types a Dexie table. `T` is the row shape, `PK` is the primary-key field name. All CRUD methods return typed results.

#### `db.version(N).stores(schema)`

Declares (or migrates to) schema version N. The schema string value per table is a comma-separated list of indexed columns. The first entry is always the primary key (prepend `++` for auto-increment integer, omit prefix for explicit string PK). Only indexed columns appear in the schema string — non-indexed columns on the TypeScript type are stored transparently; they just cannot be queried by index. New versions are additive — always keep prior version declarations if you need automatic migration.

#### `db.table.add(item)` / `db.table.put(item)` / `db.table.bulkPut(items)`

- `add` — fails if PK already exists (throws `ConstraintError`).
- `put` — upsert: inserts or replaces the full row.
- `bulkPut(items, { allKeys: true })` — batch upsert; returns array of keys.

#### `db.table.get(primaryKey)` → `Promise<T | undefined>`

Fetches one row by PK. Returns `undefined` (not throws) if absent.

#### `db.table.where(indexName).equals(value).toArray()` / `.sortBy(field)`

Index-based queries. Key entry points:

```ts
// All messages for a channel, ordered oldest-first:
await db.messages
  .where('[channelId+createdAt]')
  .between([channelId, Dexie.minKey], [channelId, Dexie.maxKey])
  .toArray();

// Outbox items in send order:
await db.outbox
  .where('state').equals('pending')
  .sortBy('createdAt');   // sort by non-indexed field after filter

// Or via compound index if createdAt is indexed:
await db.outbox
  .where('[state+createdAt]')
  .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
  .toArray();
```

#### `db.transaction('rw', db.outbox, async () => { ... })`

Explicit read-write transaction spanning one or more tables. `'r'` for read-only. All awaited Dexie operations inside the callback automatically join the transaction. The transaction is committed when the callback's returned promise resolves. Dexie transactions auto-commit — do not `await` non-Dexie promises inside (they would break the IDBTransaction scope, see Gotchas).

#### `db.table.delete(primaryKey)` / `db.table.bulkDelete(keys)`

Removes rows. `bulkDelete` accepts an array of PKs.

#### `db.table.count()` / `db.table.where(...).count()`

Returns the row count (or filtered count) as a number.

#### `db.table.orderBy(indexedField).reverse().limit(N).toArray()`

Sorted+limited reads. For DESC-ordered recent-messages reads:

```ts
await db.messages
  .where('channelId').equals(channelId)
  .reverse()
  .limit(50)
  .toArray();
```

Note: `.reverse()` applies on a single-index `.where`; compound-index range queries use `.between` with reversed bounds for DESC.

#### `db.open()` / `db.close()`

Explicit open/close. `db.open()` is called automatically on first use. In tests you call `db.close()` between test cases and re-instantiate (see fake-indexeddb section).

---

### Constructor options

`new Dexie(dbName, options?)` — options relevant to this project:

| Option | Type | Use |
|---|---|---|
| `indexedDB` | `IDBFactory` | Inject `fake-indexeddb`'s `IDBFactory` in tests (see below) |
| `IDBKeyRange` | `IDBKeyRange` | Must be co-injected with `indexedDB` override in non-browser environments |

---

### Methods with signatures

```ts
// All return Promises unless noted.
db.open(): Promise<Dexie>
db.close(): void                                // sync
db.table<T>(tableName: string): Table<T>        // runtime name-based access (use typed props instead)
db.transaction<T>(mode, tables, callback): Promise<T>
db.messages.put(item: CachedMessage): Promise<string>
db.messages.bulkPut(items: CachedMessage[]): Promise<string[]>
db.messages.get(id: string): Promise<CachedMessage | undefined>
db.messages.where(index).equals(v).toArray(): Promise<CachedMessage[]>
db.outbox.add(item: Omit<OutboxItem, 'id'>): Promise<number>  // auto-increment PK returns number
db.outbox.put(item: OutboxItem): Promise<number>
db.outbox.delete(id: number): Promise<void>
```

---

### Runtime literals

Values Dexie emits or reads at runtime. Hardcoding any of these wrong = silent prod failure.

| Category | What to capture | Value / Note |
|---|---|---|
| Env var names | SDK reads no env vars | N/A — verified SDK does not own this category |
| Cookie names | SDK emits no cookies | N/A — verified SDK does not own this category |
| Cookie prefixes | N/A | N/A — verified SDK does not own this category |
| HTTP headers | N/A — purely client-side IndexedDB | N/A — verified SDK does not own this category |
| JWT/JWE claims | N/A | N/A — verified SDK does not own this category |
| Default ports / paths / callbacks | IndexedDB database name (set by caller) | Value passed to `new Dexie('studyhall')` becomes the IDB database name shown in DevTools under `studyhall` |
| Error codes / classes | `Dexie.errnames` + thrown error `.name` | `ConstraintError` (duplicate PK on `add`), `VersionError` (downgrade attempt), `InvalidStateError` (db closed), `AbortError` (transaction aborted), `QuotaExceededError` (storage limit) — callers match on `err.name` |
| Log line formats | None emitted by default | N/A — SDK does not write log lines to console by default |
| Version negotiation strings | IDB version stored in the browser's object-store metadata | The integer passed to `.version(N)` becomes the IDB `onupgradeneeded` version; never lower this in a shipped release |

---

## Platform Compatibility

### Browser / Vite (apps/web target)

**Compatible.** Dexie 4 ships as a proper ES module with package.json `exports`. Vite resolves it correctly via `moduleResolution: Bundler`. No special Vite plugin required.

**IndexedDB availability guard (mandatory for SSR and Vite build time):**

```ts
// Guard before ANY db access — IndexedDB is undefined at build time
// and in Node test environments without the fake-indexeddb shim.
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
```

For lazy init in the app, the `db` singleton should only be created after the browser environment is confirmed. In a pure Vite SPA (no SSR) this is safe at module scope since the bundle only runs in a browser, but the guard is required for any shared/SSR code.

### Safari / Private Browsing

Safari allows IndexedDB in private mode since Safari 14. The historical exception (IDB throws in private mode on Safari 10–13) is no longer a concern for React 19 + modern targets. However, Safari iOS still enforces stricter storage quotas under Private Browsing (~7-day TTL for IDB data in regular mode, evicted sooner in private). Design the cache layer as a best-effort read cache that degrades gracefully to network fetch — never assume data survives a private-mode session across days.

Safari-specific issue: writing Blobs or ArrayBuffers to IDB on older Safari WebKit versions can fail silently. The outbox and cache tables store plain JSON-serialisable objects only (strings, numbers, arrays of scalars) — no Blobs — so this does not apply.

### PWA / Service Worker

Dexie itself does not interact with Service Workers. The existing `vite-plugin-pwa` workbox config in this project uses a `NetworkFirst` strategy for `/api/` routes. The IndexedDB Dexie store is independent — the offline-send path (wave-20) runs in the page context (not a service worker), so there is no shared-IDB concern between SW and page. If a service worker is later added that needs IDB access, a separate Dexie instance scoped to the SW context is required.

### Turborepo / pnpm workspace

Dexie is a dependency of `@studyhall/web` only (not `@studyhall/api` or any shared package). The `fake-indexeddb` devDependency follows the same scoping. No hoisting concerns — pnpm strict mode handles isolation.

### Railway deploy (production)

IndexedDB is client-side only. Railway deploy has no impact on Dexie runtime behaviour. The server (`@studyhall/api`) never imports Dexie.

### Vitest / jsdom (test environment)

jsdom does not implement IndexedDB. `fake-indexeddb` provides a full in-memory IDB implementation. See the fake-indexeddb section below for the exact setup.

---

## StudyHall Schema Design

### TypeScript row types

```ts
import type { MessageResponse } from '@studyhall/shared';

// ── Cache tables ─────────────────────────────────────────────────────────────

/**
 * CachedMessage — a MessageResponse that has been persisted to local IDB.
 *
 * Mirrors MessageResponse exactly (all fields stored). The `cachedAt` field
 * is added client-side for cache-eviction and staleness decisions.
 */
export type CachedMessage = MessageResponse & {
  /** ISO timestamp of when the client stored this row — used for TTL eviction */
  cachedAt: string;
};

/**
 * CachedChannel — minimal channel descriptor stored locally.
 *
 * Sourced from ChannelSummary in @studyhall/shared/servers. Stores the
 * data needed to render the sidebar and channel header offline.
 */
export type CachedChannel = {
  id: string;
  serverId: string;
  name: string;
  type: string;
  isPrivate: boolean;
  position: number;
  cachedAt: string;
};

// ── Outbox table ──────────────────────────────────────────────────────────────

/**
 * OutboxItem — a pending or failed outbound message held in the durable queue.
 *
 * `id` is an auto-incremented integer assigned by Dexie (PK `++id`).
 * The `idempotencyKey` is a client-generated UUID created once at enqueue time
 * and carried through all replay attempts — it is the client's handle on
 * exactly-once semantics via the server's ON CONFLICT(channel_id, idempotency_key).
 *
 * Attachment handling: `attachments` stores the ValidatedAttachment[] descriptors
 * (key + filename + contentType + sizeBytes) produced by the /confirm endpoint.
 * The presigned upload URL is NOT stored (it expires); the client re-presigns at
 * replay time if needed, or stores the confirmed key (which remains valid).
 * In wave-20 scope: attachments are carried as-is from the ValidatedAttachment[]
 * that the composer already holds — no re-presign is needed because the
 * confirmed key references an already-uploaded object.
 */
export type OutboxItem = {
  /** Auto-incremented integer PK — assigned by Dexie, absent on `add()` input */
  id?: number;
  channelId: string;
  /** Stable UUID generated once at compose-time; never regenerated on retry */
  idempotencyKey: string;
  content: string;
  /** ValidatedAttachment[] — serialised as JSON array; undefined if no attachments */
  attachments?: Array<{
    key: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
  }>;
  /** 'pending' while queued; 'failed' after max-attempts exceeded */
  state: 'pending' | 'failed';
  /** ISO timestamp of original enqueue — used for drain ordering (oldest first) */
  createdAt: string;
  /** How many delivery attempts have been made (starts at 0) */
  attempts: number;
};
```

### Dexie subclass + versioned schema

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { CachedChannel, CachedMessage, OutboxItem } from './types';

class StudyHallDB extends Dexie {
  messages!: EntityTable<CachedMessage, 'id'>;
  channels!: EntityTable<CachedChannel, 'id'>;
  outbox!:   EntityTable<OutboxItem,    'id'>;

  constructor() {
    super('studyhall');

    /**
     * v1 schema — wave-20 initial shape.
     *
     * messages indexes:
     *   - `id`                     — primary key (string UUID from server)
     *   - `channelId`              — query all messages for a channel (no order)
     *   - `[channelId+createdAt]`  — compound index for ordered reads
     *   - `createdAt`              — global time-based queries + cache eviction
     *
     * channels indexes:
     *   - `id`                     — primary key
     *   - `serverId`               — query all channels for a server
     *
     * outbox indexes:
     *   - `++id`                   — auto-increment integer PK (drain order)
     *   - `channelId`              — filter by channel
     *   - `idempotencyKey`         — dedup check before enqueue
     *   - `state`                  — filter pending vs failed
     *   - `[state+createdAt]`      — compound index for ordered drain of pending items
     *
     * Note: `cachedAt`, `content`, `attempts`, `attachments`, and all other
     * non-indexed fields are stored but not listed — Dexie stores all object
     * properties; only queried fields need indexes.
     */
    this.version(1).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox:   '++id, channelId, idempotencyKey, state, [state+createdAt]',
    });
  }
}

export const db = new StudyHallDB();
```

### Key query patterns

```ts
// ── Cache reads ───────────────────────────────────────────────────────────────

// Read cached messages for a channel, oldest-first (for chat render):
export async function getCachedMessages(channelId: string): Promise<CachedMessage[]> {
  return db.messages
    .where('[channelId+createdAt]')
    .between([channelId, Dexie.minKey], [channelId, Dexie.maxKey])
    .toArray();
}

// Write/update a batch of messages from a server response:
export async function putMessages(messages: CachedMessage[]): Promise<void> {
  await db.messages.bulkPut(messages);
}

// Cache eviction — remove messages older than N days for a channel:
export async function evictOldMessages(channelId: string, olderThan: string): Promise<void> {
  await db.messages
    .where('[channelId+createdAt]')
    .between([channelId, Dexie.minKey], [channelId, olderThan])
    .delete();
}

// ── Outbox operations ─────────────────────────────────────────────────────────

// Enqueue a new outbox item (returns the auto-increment id):
export async function enqueueOutbox(
  item: Omit<OutboxItem, 'id'>,
): Promise<number> {
  return db.outbox.add(item);
}

// Drain: get all pending items oldest-first (reconnect replay order):
export async function getPendingOutbox(): Promise<OutboxItem[]> {
  return db.outbox
    .where('[state+createdAt]')
    .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
    .toArray();
}

// Mark an outbox item as failed after final retry:
export async function markOutboxFailed(id: number): Promise<void> {
  await db.outbox.update(id, { state: 'failed' });
}

// Increment attempt count and keep pending:
export async function incrementAttempts(id: number, attempts: number): Promise<void> {
  await db.outbox.update(id, { attempts });
}

// Remove a delivered item from the outbox (exactly-once confirmed):
export async function removeFromOutbox(id: number): Promise<void> {
  await db.outbox.delete(id);
}

// Dedup guard before enqueue (idempotencyKey already queued check):
export async function isKeyInOutbox(idempotencyKey: string): Promise<boolean> {
  const count = await db.outbox.where('idempotencyKey').equals(idempotencyKey).count();
  return count > 0;
}
```

---

## fake-indexeddb Vitest Setup

### Install

```
pnpm add -D --filter @studyhall/web fake-indexeddb
```

`fake-indexeddb` v6 ships as an ES module. It provides a complete in-memory `IDBFactory` and `IDBKeyRange` that Dexie can consume in Node/jsdom environments where `globalThis.indexedDB` is absent.

### Approach: per-test `IDBFactory` injection (recommended for isolation)

Inject a fresh `IDBFactory` into the Dexie constructor for each test. This provides hard isolation (no shared state between tests) without needing global setup.

```ts
// apps/web/src/features/sync/db.test.ts
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StudyHallDB } from './db';

// Factory is defined in describe scope — one instance per file.
// Re-instantiate in beforeEach for full isolation.
let db: StudyHallDB;

beforeEach(() => {
  // Each test gets its own IDBFactory — no shared state across tests.
  const idbFactory = new IDBFactory();
  db = new StudyHallDB(idbFactory); // See constructor variant below.
});

afterEach(async () => {
  await db.close();
  // The IDBFactory is GC'd with the test scope — no manual reset needed.
});
```

To support injection the `StudyHallDB` constructor accepts an optional `IDBFactory`:

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { CachedChannel, CachedMessage, OutboxItem } from './types';

export class StudyHallDB extends Dexie {
  messages!: EntityTable<CachedMessage, 'id'>;
  channels!: EntityTable<CachedChannel, 'id'>;
  outbox!:   EntityTable<OutboxItem,    'id'>;

  constructor(idbFactory?: IDBFactory) {
    super('studyhall', idbFactory ? { indexedDB: idbFactory } : undefined);
    this.version(1).stores({
      messages: 'id, channelId, [channelId+createdAt], createdAt',
      channels: 'id, serverId',
      outbox:   '++id, channelId, idempotencyKey, state, [state+createdAt]',
    });
  }
}

// Production singleton — no injected factory (uses browser's indexedDB).
export const db = new StudyHallDB();
```

### Approach: global auto-shim via `import 'fake-indexeddb/auto'`

Alternatively, add the auto-shim to the test setup file. This patches `globalThis.indexedDB` and `globalThis.IDBKeyRange` for the entire test process. Easier setup but provides shared state — tests must manually reset the database or use `beforeEach` to re-open a fresh Dexie instance.

```ts
// apps/web/src/test-setup.ts  (add this import)
import 'fake-indexeddb/auto';
```

Then in tests, reset between cases by closing + re-opening with `indexedDB.deleteDatabase`:

```ts
afterEach(async () => {
  await db.close();
  // Delete the named database from the global fake store:
  const req = indexedDB.deleteDatabase('studyhall');
  await new Promise<void>((res, rej) => {
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
});
```

**Recommendation for this project:** use the per-test `IDBFactory` injection pattern. It avoids test-order coupling and requires no global teardown. The `import 'fake-indexeddb/auto'` approach is fine for quick smoke tests but creates silent coupling risks across the test suite.

### Example unit test

```ts
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StudyHallDB } from './db';
import type { OutboxItem } from './types';

describe('outbox', () => {
  let db: StudyHallDB;

  beforeEach(() => {
    db = new StudyHallDB(new IDBFactory());
  });

  afterEach(async () => {
    await db.close();
  });

  it('enqueues and drains in createdAt order', async () => {
    const t0 = '2026-06-30T10:00:00.000Z';
    const t1 = '2026-06-30T10:01:00.000Z';

    const a: Omit<OutboxItem, 'id'> = {
      channelId: 'ch-1',
      idempotencyKey: 'key-a',
      content: 'first',
      state: 'pending',
      createdAt: t1,     // later timestamp
      attempts: 0,
    };
    const b: Omit<OutboxItem, 'id'> = {
      channelId: 'ch-1',
      idempotencyKey: 'key-b',
      content: 'second',
      state: 'pending',
      createdAt: t0,     // earlier timestamp
      attempts: 0,
    };

    await db.outbox.add(a);
    await db.outbox.add(b);

    const pending = await db.outbox
      .where('[state+createdAt]')
      .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
      .toArray();

    // Oldest-first drain order
    expect(pending[0]?.idempotencyKey).toBe('key-b');
    expect(pending[1]?.idempotencyKey).toBe('key-a');
  });
});
```

---

## React Integration Pattern

### Singleton export

`db` is exported as a module-level singleton from `apps/web/src/features/sync/db.ts`. All hooks and service functions import from this single module. No React context needed — the Dexie instance is not React-lifecycle-bound.

### Lazy guard for non-browser environments

The module file may be imported during Vite's build/SSR analysis. Guard the singleton construction:

```ts
// features/sync/db.ts
export const db: StudyHallDB | null =
  typeof indexedDB !== 'undefined' ? new StudyHallDB() : null;
```

In the web app (pure browser bundle) `indexedDB` is always defined at runtime, so callers can treat the `null` case as a type-system guard only. In practice for this project (no SSR), a direct `new StudyHallDB()` at module scope is safe — Vite's build target is `es2022` (browser-only bundle).

### `useLiveQuery` (dexie-react-hooks) — considered, not adopted

`dexie-react-hooks` exports `useLiveQuery` which re-renders a component when IDB data changes. It requires an additional package (`dexie-react-hooks`) and introduces a Suspense boundary requirement. For wave-20's scope — where the cache is a backing store for `useMessages` rather than the primary data source — plain async Dexie calls via `useEffect` + the existing `useState` in `useMessages` is the simpler integration. `useLiveQuery` is appropriate if a future wave makes the IDB cache the sole read path (replacing the in-memory state with live IDB queries).

### Integration with `useMessagesWithRetry` (the Dexie outbox backing the optimistic state)

The Dexie outbox is the **durable backing store** for the existing in-memory optimistic send path in `useMessages`. The integration contract:

1. `sendMessage()` → write to `db.outbox` (enqueue) first, then reflect in `optimisticMessages` state as before. The Dexie row is the durable record; the React state is the display layer.
2. On success: `db.outbox.delete(id)` + move message to `realMessages` (existing behaviour).
3. On failure: `db.outbox.update(id, { state: 'failed', attempts: n })` + reflect in `optimisticMessages` state.
4. On reconnect: drain `db.outbox` `where('[state+createdAt]').between(...)` oldest-first → replay each item via `api.sendMessage()` with the original `idempotencyKey`. The server's `ON CONFLICT(channel_id, idempotency_key) DO NOTHING` ensures exactly-once.
5. On app cold-start with pending outbox items: load `getPendingOutbox()` and inject into `optimisticMessages` so the user sees them as still-pending. This is the "durable across page reload" property.

### Channel / message cache flow

```
useMessages → (on mount) → load from db.messages for channelId (offline read)
                         → fetch api.listMessages() when online (fresh data)
                         → bulkPut() server response into db.messages
Socket.IO message:new   → append to realMessages state + db.messages.put()
loadOlder()             → fetch + db.messages.bulkPut()
```

The cache serves as the seed for offline reading. On reconnect, the forward `?after=` catch-up cursor (wave-20 task 92d85e0e) fetches messages produced while offline and fills the gap.

---

## Known Gotchas

### 1. IndexedDB schema version — never lower

Once a user's browser has opened the database at version N, deploying a schema with a lower version will cause `VersionError` and the database will refuse to open. Every schema change must increment the version and provide a migration:

```ts
this.version(1).stores({ /* original */ });
this.version(2).stores({ /* adds index */ }).upgrade(tx => {
  // optional data migration
});
```

Keep all prior `.version()` declarations in the constructor — Dexie uses them to migrate browsers that skipped versions.

### 2. Transactions and non-Dexie async operations

IndexedDB transactions auto-commit when no pending IDB requests remain. If you `await` a non-IDB operation (fetch, `setTimeout`, etc.) inside a `db.transaction()` callback, the IDB transaction will have auto-committed by the time the `await` resolves. Dexie will throw `TransactionInactiveError`. Rule: inside `db.transaction()`, only `await` other Dexie operations. Fetch data before the transaction, then transact.

### 3. Safari Private Browsing quota

Safari Private mode has an aggressive storage quota (~50MB for the entire origin, shared across IDB/localStorage/Cache API). Exceeding it throws `QuotaExceededError`. The cache eviction strategy should be invoked proactively. Catch `QuotaExceededError` on writes and handle gracefully (evict + retry, or skip caching).

### 4. Vite / build-time import

Dexie imports `indexedDB` from the global scope. In a pure browser bundle (this project's setup) there is no issue. If code that imports Dexie is ever pulled into a Node.js worker (e.g., Vitest worker without fake-indexeddb) it will throw on first `db.*` call. The injectable `IDBFactory` constructor pattern solves this for tests.

### 5. Compound index key range with Dexie

Compound index queries use `[field1+field2]` notation in the schema. The `.between()` call takes `[v1, v2]` arrays as lower/upper bounds. `Dexie.minKey` and `Dexie.maxKey` are special sentinels for open-ended bounds:

```ts
// All messages for channelId, any createdAt:
.where('[channelId+createdAt]')
.between([channelId, Dexie.minKey], [channelId, Dexie.maxKey])
```

Do not use `Dexie.minKey`/`Dexie.maxKey` with single-column indexes — they are for compound bound open ends only.

### 6. Drain order for the outbox

The auto-increment PK (`++id`) provides insertion order by default. For the reconnect replay loop, drain via the compound `[state+createdAt]` index to honour wall-clock send order (oldest-first). Replay items sequentially (one-at-a-time), not concurrently — the server deduplicates via idempotency_key but concurrent sends can produce observable out-of-order delivery in the channel stream.

### 7. Bundle size

Dexie 4.x: ~22 KB gzipped. fake-indexeddb is devOnly and does not enter the production bundle. No tree-shaking concerns — the entire Dexie module is needed.

### 8. `EntityTable` vs `Table` typing

`EntityTable<T, 'pk'>` (from `import { type EntityTable } from 'dexie'`) is preferred over `Table<T>` for typed subclasses in TypeScript strict mode. It correctly types `.get()` return as `T | undefined` and `.add()` input as `Omit<T, 'id'>` for auto-increment tables, which aligns with `exactOptionalPropertyTypes: true` in this project's tsconfig.

### 9. `exactOptionalPropertyTypes` + optional fields

This project has `exactOptionalPropertyTypes: true` in `tsconfig.base.json`. Dexie's `update(id, changes)` second parameter is typed as `Partial<T>`. With `exactOptionalPropertyTypes`, `{ state: 'failed' }` satisfies `Partial<OutboxItem>` cleanly because `state` is non-optional in `OutboxItem`. Fields that are genuinely optional (`attachments?: ...`) must be treated carefully — do not include them as `undefined` in update payloads; omit them entirely.

---

## Documentation Links

- Getting Started: https://dexie.org/docs/Tutorial/Getting-started
- API Reference: https://dexie.org/docs/API-Reference
- Version + Schema: https://dexie.org/docs/Version/Version.stores()
- Compound Indexes: https://dexie.org/docs/Compound-Index
- Transactions: https://dexie.org/docs/Dexie/Dexie.transaction()
- TypeScript: https://dexie.org/docs/Typescript
- EntityTable: https://dexie.org/docs/EntityTable/EntityTable
- Migration Guide (v3→v4): https://dexie.org/docs/Version/Version.upgrade()
- GitHub Issues: https://github.com/dexie/Dexie.js/issues
- fake-indexeddb README: https://github.com/dumbmatter/fakeIndexedDB
- fake-indexeddb API: https://github.com/dumbmatter/fakeIndexedDB#readme

---

## Integration-Specific Findings

*(Populated after implementation — wave-20 B-block)*

### Our adapter patterns
*(TBD after B-3/B-4)*

### Env var configuration on our platforms
*(TBD — no env vars owned by this SDK)*

### Bugs we hit and how we solved them
*(TBD after implementation)*

### What differed from the official docs
*(TBD after implementation)*
