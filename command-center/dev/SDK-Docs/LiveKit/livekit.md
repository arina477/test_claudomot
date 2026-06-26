# LiveKit Reference

**Last verified:** 2026-06-26
**Official docs:** https://docs.livekit.io/
**GitHub:** https://github.com/livekit/node-sdks (server SDK) · https://github.com/livekit/client-sdk-js (browser) · https://github.com/livekit/components-js (React components)
**Installed version (server SDK):** livekit-server-sdk 2.15.5
**Installed version (React components):** @livekit/components-react 2.9.21
**Installed version (browser client):** livekit-client 2.20.0
**Install location:**
- `apps/api` — `livekit-server-sdk` (token mint + room management only; NOT imported in `apps/web`)
- `apps/web` — `@livekit/components-react`, `livekit-client`

> ANTI-PATTERN GUARD: `livekit-server-sdk` and `AccessToken` must never appear in `apps/web`. Any import of `livekit-server-sdk` under the frontend workspace ships the API secret into the browser bundle.

---

## Official API Surface

### livekit-server-sdk (Node.js — `apps/api` only)

#### AccessToken

Source: `github.com/livekit/node-sdks` — `packages/livekit-server-sdk/src/AccessToken.ts`

```typescript
export interface AccessTokenOptions {
  ttl?: number | string;   // number = seconds; string = vercel/ms format e.g. '4h', '2 days'
  name?: string;           // display name (JWT `name` claim) — distinct from identity
  identity?: string;       // unique participant ID (JWT `sub` claim) — required for roomJoin
  metadata?: string;       // opaque string attached to participant
  attributes?: Record<string, string>; // added v2.5.0
}

constructor(apiKey?: string, apiSecret?: string, options?: AccessTokenOptions)
```

**Env var fallback (constructor only):**
- If `apiKey` is omitted the constructor reads `process.env.LIVEKIT_API_KEY`
- If `apiSecret` is omitted the constructor reads `process.env.LIVEKIT_API_SECRET`
- Throws `Error('api-key and api-secret must be set')` if neither constructor arg nor env var is present

**Default TTL:** `'6h'` (the literal string constant `defaultTTL` in source). StudyHall overrides this to `'4h'` per the bounded-TTL requirement.

**Key methods:**

```typescript
addGrant(grant: VideoGrant): void
// Merges into this.grants.video — call once with the full grant object

async toJwt(): Promise<string>
// ASYNC (breaking change from v1 which had synchronous toJWT()).
// Signs with HS256 via the `jose` library.
// Throws Error('identity is required for join but not set') if roomJoin=true and no identity.
```

#### VideoGrant

Source: `github.com/livekit/node-sdks` — `packages/livekit-server-sdk/src/grants.ts`

```typescript
export interface VideoGrant {
  // Room-level permissions (server management)
  roomCreate?: boolean;
  roomJoin?: boolean;        // must be true for a participant join token
  roomList?: boolean;
  roomRecord?: boolean;
  roomAdmin?: boolean;
  ingressAdmin?: boolean;

  // Room scoping — REQUIRED when roomJoin=true
  room?: string;             // exact room name (= channel name in StudyHall)

  // Track permissions
  canPublish?: boolean;      // allow publishing audio/video tracks
  canPublishSources?: TrackSource[];  // serialised as strings in JWT: 'camera'|'microphone'|'screen_share'|'screen_share_audio'
  canSubscribe?: boolean;    // allow receiving tracks
  canPublishData?: boolean;  // allow data channel sends
  canUpdateOwnMetadata?: boolean;

  // Special participant types
  hidden?: boolean;          // participant is invisible to others
  recorder?: boolean;        // recorder agent
  agent?: boolean;           // added v2.0.4
  canSubscribeMetrics?: boolean;
  canManageAgentSession?: boolean; // added v2.15.3

  destinationRoom?: string;  // added v2.12.0
}
```

**StudyHall minimal participant grant** (scoped to a specific channel, identity = userId):

```typescript
const at = new AccessToken(apiKey, apiSecret, { identity: userId, ttl: '4h' });
at.addGrant({
  roomJoin: true,
  room: channelId,          // room name = StudyHall channel ID
  canPublish: true,
  canSubscribe: true,
});
const token = await at.toJwt();
```

#### ClaimGrants (JWT payload shape)

Source: `github.com/livekit/node-sdks` — `packages/livekit-server-sdk/src/grants.ts`

```typescript
export interface ClaimGrants extends JWTPayload {
  name?: string;
  video?: VideoGrant;
  sip?: SIPGrant;
  inference?: InferenceGrant;
  observability?: ObservabilityGrant;
  kind?: string;
  metadata?: string;
  attributes?: Record<string, string>;
  sha256?: string;
  roomPreset?: string;
  roomConfig?: RoomConfiguration;
}
```

#### RoomServiceClient

Source: `github.com/livekit/node-sdks` — `packages/livekit-server-sdk/src/RoomServiceClient.ts`

```typescript
export type ClientOptions = {
  requestTimeout?: number; // seconds
};

constructor(host: string, apiKey?: string, secret?: string, options?: ClientOptions)
// NOTE: RoomServiceClient does NOT fall back to env vars — args are required.

// Key methods:
async createRoom(options: CreateOptions): Promise<Room>
async listRooms(names?: string[]): Promise<Room[]>
async deleteRoom(room: string): Promise<void>
async updateRoomMetadata(room: string, metadata: string): Promise<Room>
async listParticipants(room: string): Promise<ParticipantInfo[]>
async getParticipant(room: string, identity: string): Promise<ParticipantInfo>
async removeParticipant(room: string, identity: string, options?: RemoveParticipantOptions): Promise<void>
async mutePublishedTrack(room: string, identity: string, trackSid: string, muted: boolean): Promise<TrackInfo>
async updateParticipant(room: string, identity: string, options: UpdateParticipantOptions): Promise<ParticipantInfo>
async sendData(room: string, data: Uint8Array, kind: DataPacket_Kind, options: SendDataOptions): Promise<void>
```

**Transport:** Twirp RPC over standard `fetch()` POST. Path prefix `/twirp`. No HTTP/2 forced. Headers: `Content-Type: application/json;charset=UTF-8` + `Authorization: Bearer <jwt>`.

**Error class:** `TwirpError` (introduced as a breaking change in v2.10.0 — prior versions threw `LivekitError`).

---

### @livekit/components-react (`apps/web`)

Package lives in monorepo: `github.com/livekit/components-js` (NOT `components-react` — that URL 404s).

Source: `github.com/livekit/components-js` — `packages/react/src/`

#### LiveKitRoom

```typescript
export interface LiveKitRoomProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  serverUrl: string | undefined;        // wss:// URL of LiveKit server
  token: string | undefined;            // JWT from POST /api/v1/channels/:id/voice/token
  audio?: AudioCaptureOptions | boolean;
  video?: VideoCaptureOptions | boolean;
  screen?: ScreenShareCaptureOptions | boolean;
  connect?: boolean;                    // if false, room is created but not connected
  options?: RoomOptions;                // livekit-client RoomOptions
  connectOptions?: RoomConnectOptions;  // livekit-client RoomConnectOptions
  onConnected?: () => void;             // no Room arg — use useRoomContext() inside
  onDisconnected?: (reason?: DisconnectReason) => void;
  onError?: (error: Error) => void;
  onMediaDeviceFailure?: (failure?: MediaDeviceFailure, kind?: MediaDeviceKind) => void;
  onEncryptionError?: (error: Error) => void;
  room?: Room;                          // supply a pre-created Room instance
  simulateParticipants?: number;
  featureFlags?: FeatureFlags;
}
```

**RULE:** Render exactly one `LiveKitRoom` per active voice session. Multiple instances double-publish tracks and corrupt the participant grid.

**Audio-only fallback pattern:** Pass `video={false}` (or omit it) and handle `onMediaDeviceFailure` to degrade gracefully when camera permission is denied. Never pass `video={true}` without an audio-only branch.

#### useTracks

```typescript
export function useTracks<T extends SourcesArray = Track.Source[]>(
  sources?: T,
  options?: {
    updateOnlyOn?: RoomEvent[];
    onlySubscribed?: boolean;
    room?: Room;
  }
): TrackReference[] | TrackReferenceOrPlaceholder[]
```

Default sources when none passed: Camera, Microphone, ScreenShare, ScreenShareAudio, Unknown.

#### useRoomContext

```typescript
export function useRoomContext(): Room
// Throws: 'tried to access room context outside of livekit room component'
// Must be called inside a <LiveKitRoom> subtree.
```

#### useParticipants

```typescript
export function useParticipants(options?: {
  updateOnlyOn?: RoomEvent[];
  room?: Room;
}): (LocalParticipant | RemoteParticipant)[]
// Always updates on: ParticipantConnected, ParticipantDisconnected, ConnectionStateChanged
// (even when updateOnlyOn is specified — those three are mandatory)
```

#### useLocalParticipant

```typescript
export function useLocalParticipant(options?: { room?: Room }): {
  isMicrophoneEnabled: boolean;
  isScreenShareEnabled: boolean;
  isCameraEnabled: boolean;
  microphoneTrack: TrackPublication | undefined;
  cameraTrack: TrackPublication | undefined;
  lastMicrophoneError: Error | undefined;
  lastCameraError: Error | undefined;
  localParticipant: LocalParticipant;
}
```

#### ControlBar (prefab)

```typescript
// Lives in prefabs/ not components/ — import path: @livekit/components-react
export type ControlBarControls = {
  microphone?: boolean;
  camera?: boolean;
  chat?: boolean;
  screenShare?: boolean;
  leave?: boolean;
  settings?: boolean;
};

export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  variation?: 'minimal' | 'verbose' | 'textOnly';
  controls?: ControlBarControls;
  saveUserChoices?: boolean; // @alpha — defaults to true
}
```

#### AudioTrack

```typescript
export interface AudioTrackProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
  trackRef?: TrackReference;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  volume?: number;
  muted?: boolean;
}
```

#### VideoTrack

```typescript
export interface VideoTrackProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  trackRef?: TrackReference;
  onTrackClick?: (evt: ParticipantClickEvent) => void;
  onSubscriptionStatusChanged?: (subscribed: boolean) => void;
  manageSubscription?: boolean;
}
```

---

### livekit-client (`apps/web`)

Source: `github.com/livekit/client-sdk-js`

#### Room.connect

```typescript
connect = async (url: string, token: string, opts?: RoomConnectOptions): Promise<void>
```

`RoomConnectOptions`:

```typescript
export interface RoomConnectOptions {
  autoSubscribe?: boolean;        // default: true
  peerConnectionTimeout?: number; // default: 15s (ms)
  rtcConfig?: RTCConfiguration;
  maxRetries?: number;
  websocketTimeout?: number;      // default: 15s (ms)
}
```

**RULE:** Always call `room.disconnect()` on component unmount or page leave. Orphaned connections consume LiveKit Cloud participant-minutes and slot capacity.

#### LocalParticipant media control

```typescript
await room.localParticipant.setMicrophoneEnabled(enabled: boolean): Promise<LocalTrackPublication | undefined>
await room.localParticipant.setCameraEnabled(enabled: boolean): Promise<LocalTrackPublication | undefined>
await room.localParticipant.setScreenShareEnabled(enabled: boolean): Promise<LocalTrackPublication | undefined>
await room.localParticipant.enableCameraAndMicrophone(): Promise<void>
```

#### ConnectionState enum

Source: `github.com/livekit/client-sdk-js` — `src/room/Room.ts`

```typescript
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  SignalReconnecting = 'signalReconnecting',
}
```

#### DisconnectReason enum

Source: `github.com/livekit/protocol` — `protobufs/livekit_models.proto`

```typescript
// Values relevant to StudyHall:
UNKNOWN_REASON = 0
CLIENT_INITIATED = 1          // room.disconnect() called
DUPLICATE_IDENTITY = 2        // another client joined with same identity
SERVER_SHUTDOWN = 3
PARTICIPANT_REMOVED = 4       // kicked by room admin
ROOM_DELETED = 5
JOIN_FAILURE = 7
CONNECTION_TIMEOUT = 14
MEDIA_FAILURE = 15
```

#### Error classes (client SDK)

Source: `github.com/livekit/client-sdk-js` — `src/room/errors.ts`

Base: `LivekitError` (properties: `code: number`, `cause?: unknown`)

| Class | Code |
|---|---|
| `ConnectionError` | 1 |
| `TrackInvalidError` | 20 |
| `DeviceUnsupportedError` | 21 |
| `PublishTrackError` | 15 |
| `NegotiationError` | 13 |
| `UnexpectedConnectionState` | 12 |

`MediaDeviceFailure` enum (used in `onMediaDeviceFailure`): `PermissionDenied`, `NotFound`, `DeviceInUse`, `Other`

`ConnectionErrorReason` enum: `NotAllowed`, `ServerUnreachable`, `InternalError`, `Cancelled`, `LeaveRequest`, `Timeout`, `WebSocket`, `ServiceNotFound`

---

### Runtime literals table

Values the SDK emits or reads at runtime. Hardcoding any of these wrong in spec or implementation = silent 100% prod failure. Every row verified against official source (docs URL or source file).

| Category | Literal | Value | Source |
|---|---|---|---|
| **Env var names** | API key env var | `LIVEKIT_API_KEY` | `AccessToken.ts` — read by constructor when `apiKey` arg is omitted |
| **Env var names** | API secret env var | `LIVEKIT_API_SECRET` | `AccessToken.ts` — read by constructor when `apiSecret` arg is omitted |
| **Env var names** | Config env var (self-host) | `LIVEKIT_CONFIG` | `config-sample.yaml` — accepts full YAML config body |
| **Env var names** | TURN cert env var | `LIVEKIT_TURN_CERT` | `docs.livekit.io/home/self-hosting/deployment/` |
| **Env var names** | TURN key env var | `LIVEKIT_TURN_KEY` | `docs.livekit.io/home/self-hosting/deployment/` |
| **Env var names** | `RoomServiceClient` env vars | NONE — constructor args required | `RoomServiceClient.ts` — no env var fallback (unlike AccessToken) |
| **Cookie names** | N/A — SDK does not set cookies | N/A — verified SDK does not own this category | `AccessToken.ts`, `LiveKitRoom.tsx` |
| **Cookie prefixes** | N/A | N/A — verified SDK does not own this category | N/A |
| **HTTP headers** | RoomServiceClient request headers | `Content-Type: application/json;charset=UTF-8`, `Authorization: Bearer <jwt>` | `TwirpRPC.ts` |
| **HTTP headers** | Twirp RPC path prefix | `/twirp` | `TwirpRPC.ts` — full path: `/twirp/${package}.${service}/${method}` |
| **WS URL scheme** | Client connection URL scheme | `wss://` (production), `ws://` (local dev only) | `docs.livekit.io/home/self-hosting/deployment/` |
| **JWT claims** | Issuer claim | `iss` = API key string | `AccessToken.ts` — `setIssuer(this.apiKey)` |
| **JWT claims** | Identity/subject claim | `sub` = participant identity | `AccessToken.ts` — `setSubject(this.identity)` |
| **JWT claims** | Expiry claim | `exp` = Unix epoch seconds | `AccessToken.ts` — `setExpirationTime(this.ttl)` via jose |
| **JWT claims** | Not-before claim | `nbf` = Unix epoch seconds | `AccessToken.ts` — `setNotBefore(new Date())` |
| **JWT claims** | Video grant claim | `video` = VideoGrant object | `grants.ts` — `ClaimGrants.video` |
| **JWT claims** | Display name claim | `name` = string (distinct from `sub`) | `grants.ts` — `ClaimGrants.name`, `AccessTokenOptions.name` |
| **JWT claims** | Metadata claim | `metadata` = string | `grants.ts` — `ClaimGrants.metadata` |
| **JWT claims** | Attributes claim | `attributes` = `Record<string,string>` | `grants.ts` — added v2.5.0 |
| **VideoGrant field names** | Room join flag | `roomJoin` (camelCase) | `grants.ts` |
| **VideoGrant field names** | Room scope | `room` (exact string = room name) | `grants.ts` — required when `roomJoin: true` |
| **VideoGrant field names** | Publish permission | `canPublish` | `grants.ts` |
| **VideoGrant field names** | Subscribe permission | `canSubscribe` | `grants.ts` |
| **VideoGrant field names** | Data publish permission | `canPublishData` | `grants.ts` |
| **VideoGrant field names** | Publish source filter | `canPublishSources` | `grants.ts` — serialised as strings: `'camera'`, `'microphone'`, `'screen_share'`, `'screen_share_audio'` |
| **VideoGrant field names** | Hidden participant | `hidden` | `grants.ts` |
| **VideoGrant field names** | Recorder participant | `recorder` | `grants.ts` |
| **Default ports (self-host)** | HTTP/WebSocket signaling | `7880` | `config-sample.yaml` + `docs.livekit.io/home/self-hosting/ports-firewall/` |
| **Default ports (self-host)** | ICE over TCP (fallback) | `7881` | `config-sample.yaml` + `docs.livekit.io/home/self-hosting/ports-firewall/` |
| **Default ports (self-host)** | UDP media range | `50000–60000` | `config-sample.yaml` — `port_range_start: 50000`, `port_range_end: 60000` |
| **Default ports (self-host)** | TURN/STUN UDP | `3478` | `config-sample.yaml` — `turn.udp_port` |
| **Default ports (self-host)** | TURN TLS | `5349` | `config-sample.yaml` — `turn.tls_port` |
| **Default ports (self-host)** | UDP mux (optional, consolidates UDP) | `7882` | `config-sample.yaml` — optional single-port alternative to range |
| **Default TTL** | AccessToken default TTL | `'6h'` (the literal constant `defaultTTL`) | `AccessToken.ts` — StudyHall uses `'4h'` override |
| **Error codes** | Server SDK error class (v2.10.0+) | `TwirpError` | `CHANGELOG.md` — breaking change in v2.10.0, replaced prior `LivekitError` |
| **Error codes** | Client SDK base error class | `LivekitError` (code: number) | `client-sdk-js/src/room/errors.ts` |
| **Error codes** | Media device failure | `MediaDeviceFailure.PermissionDenied`, `.NotFound`, `.DeviceInUse`, `.Other` | `client-sdk-js/src/room/errors.ts` |
| **Log line formats** | N/A — SDK does not own a log line format StudyHall parses | N/A — verified SDK does not own this category | N/A |
| **Version negotiation** | N/A — no version string in signaling | N/A — verified SDK does not own this category for StudyHall's integration surface | N/A |

---

## Platform Compatibility

### Railway (deployment target)

#### LiveKit Cloud (recommended for self-use-mvp)

- No Railway ops overhead. Zero-config UDP/TURN — LiveKit Cloud manages STUN/TURN infrastructure.
- Only `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` are needed in Railway env vars.
- Free tier: 100 participant-minutes/month, 100 concurrent participants.
- Cloud project URL format: `wss://<project-slug>.livekit.cloud`
- API key and secret are account-issued from `cloud.livekit.io` console — founder must provision.
- SDK call is identical to self-hosted path; only `LIVEKIT_URL` env var value changes.

#### LiveKit Self-Hosted on Railway (deferred — only if Cloud free tier is regularly exceeded)

**CRITICAL CONSTRAINT — UDP and TURN on Railway:**

Railway exposes services over HTTP/HTTPS (TCP) only. It does not support arbitrary UDP port ranges. WebRTC media flows over UDP (ports 50000–60000 by default). Without UDP exposure and a TURN relay, clients behind symmetric NAT (a significant fraction of real users, particularly on mobile networks and corporate WiFi) cannot establish WebRTC media connections.

**What this means for self-hosting on Railway:**

1. The LiveKit signaling WebSocket (port 7880) can be exposed via Railway's standard HTTPS service — this works normally.
2. ICE over TCP (port 7881) can be exposed as an additional Railway TCP service — this provides a fallback for TCP-only clients.
3. **UDP media (ports 50000–60000) cannot be exposed via Railway's standard service model** — Railway does not support UDP port ranges on Railway services.
4. LiveKit's built-in TURN server (configured via `turn:` in `LIVEKIT_CONFIG`) provides TURN-over-TLS on port 5349 or TURN-over-UDP on 3478, but these UDP ports also cannot be directly exposed via Railway.

**Viable self-host paths on Railway:**
- Use an external TURN server (e.g. Cloudflare Calls TURN, Twilio STUN/TURN, or a Coturn instance on a VPS with UDP exposed) and configure LiveKit's `rtc.use_external_ip: true` with the external TURN relay.
- Use LiveKit's `rtc.udp_mux_port: 7882` with port 7882 exposed as a Railway TCP service — this consolidates all UDP through a single mux port, but Railway still only supports TCP, so this only works for the ICE-over-TCP path, not true UDP.

**Practical verdict:** Self-hosting LiveKit on Railway without an external infrastructure provider for UDP is production-unsuitable for any users behind symmetric NAT. This is not a StudyHall limitation — it is an intrinsic Railway platform constraint. **Use LiveKit Cloud for self-use-mvp.** Revisit self-hosting on a VPS (DigitalOcean, Hetzner, Fly.io) if Railway-only is required.

**Self-host config env var:**
```
LIVEKIT_CONFIG=<full YAML body>
# or mount a config.yaml and pass --config flag
```

Required `config.yaml` keys for self-host:
```yaml
port: 7880
rtc:
  use_external_ip: true    # required on cloud VMs; discovers public IP via STUN
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
turn:
  enabled: true
  domain: turn.yourhost.com
  tls_port: 5349
  cert_file: /path/to/cert.pem
  key_file: /path/to/key.pem
keys:
  your_api_key: your_api_secret
```

---

### Node.js / NestJS server (`apps/api`)

- `livekit-server-sdk` requires **Node 18+** (Node 19+ per v2.2.0 CHANGELOG note; v2.0.0 sets Node 18 as minimum).
- StudyHall uses Node 22 (current LTS) — fully compatible.
- **ESM-only** since v2.0.0 — `"type": "module"` required or use dynamic `import()`. NestJS with `"module": "NodeNext"` / `"moduleResolution": "bundler"` is compatible.
- `toJwt()` is **async** since v2.0.0 — callers must `await` it. Forgetting `await` returns a Promise, not a token string, causing silent client connection failures.
- `RoomServiceClient` HTTP calls use standard `fetch()` — available natively in Node 22.

---

### Vite / React SPA (`apps/web`)

- `@livekit/components-react` is a client-side React library — fully Vite-compatible.
- `livekit-client` has no Node.js dependency — browser-only.
- Vite `manualChunks` splits the LiveKit bundle into `vendor-livekit` (per `_library.md` tools section) to avoid bloating the main bundle.
- Browser autoplay policy applies to audio tracks. `LiveKitRoom` internally handles autoplay unlock via user gesture detection. Do not attempt to play audio tracks before a user interaction has occurred.
- `VITE_LIVEKIT_URL` (the wss:// URL) is safe to embed at build time — it is a server endpoint URL, not a credential. `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` must NEVER use a `VITE_` prefix.

---

## Known Gotchas

### 1. `toJwt()` is async — forgetting `await` is a silent failure

Since v2.0.0, `AccessToken.toJwt()` returns `Promise<string>`. If you omit `await`, the token endpoint returns the Promise object serialized, not the JWT string. The client will fail to connect with an opaque authentication error. Always:

```typescript
const token = await at.toJwt(); // not at.toJwt()
```

### 2. `identity` is required for `roomJoin: true`

If `roomJoin` is true and no `identity` is set on the AccessToken options, `toJwt()` throws synchronously before the JWT is built:

```
Error: identity is required for join but not set
```

Always set `identity = userId` in `AccessTokenOptions`. This maps LiveKit participants to StudyHall users for presence, moderation, and `voice_sessions`.

### 3. `RoomServiceClient` does not read env vars

Unlike `AccessToken`, `RoomServiceClient` requires explicit `host`, `apiKey`, and `secret` constructor arguments — it will NOT fall back to `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` env vars. Pass them explicitly from `ConfigService`.

### 4. Token TTL + refresh boundary

The default TTL is `'6h'`. StudyHall uses `'4h'` for a shorter bound. Tokens cannot be revoked once issued (no token blocklist in LiveKit at self-use-mvp scale). The client must call `POST /api/v1/channels/:id/voice/token` before the token expires to get a fresh token. The `livekit-client` `Room` object exposes `room.state` and the `TokenExpiring` event for refresh triggering.

### 5. TURN/UDP on PaaS — the WebRTC media constraint

Every client behind symmetric NAT (common on mobile networks and corporate WiFi) requires a TURN relay to establish a WebRTC connection. Without TURN, those clients connect to signaling (WebSocket) successfully but ICE negotiation fails silently for media. This manifests as participants seeing each other in the room list but hearing/seeing nothing.

On Railway: UDP port ranges cannot be exposed. **Use LiveKit Cloud for self-use-mvp** — it includes managed TURN infrastructure. If self-hosting outside Railway (VPS with UDP exposure), LiveKit's built-in TURN server handles this; set `use_external_ip: true` and configure the `turn:` block in config.

### 6. Browser autoplay and audio tracks

Browsers block audio autoplay without a user gesture. The first time a remote participant's audio track arrives, the browser may block playback. `@livekit/components-react`'s `AudioTrack` component handles the autoplay unlock UX internally, but your layout must ensure a user interaction (e.g. "Join Room" button click) happens before `connect: true` is set on `LiveKitRoom`. Do not auto-connect on page load.

### 7. Audio-only fallback — never require camera to join

`LiveKitRoom` with `video={true}` will call `getUserMedia({ video: true })` on connect. If camera permission is denied (common in headless environments, locked-down browsers, or users who declined), the join itself may fail with `MediaDeviceFailure.PermissionDenied`. Always:

- Pass `video={false}` by default; upgrade to video explicitly via user action.
- Handle `onMediaDeviceFailure` on `LiveKitRoom` and degrade to audio-only with a UI indicator.
- The `canPublish: true` grant allows publishing both audio and video. The participant chooses what to publish client-side via `setMicrophoneEnabled` / `setCameraEnabled`.

### 8. Room connection leak on unmount

`LiveKitRoom` automatically calls `room.disconnect()` on unmount when it manages the `Room` instance internally. However, if you create a `Room` instance externally and pass it via the `room` prop, you are responsible for calling `room.disconnect()` in your cleanup effect. Failing to disconnect leaves an open WebSocket and a live participant slot in the LiveKit room, consuming Cloud participant-minutes indefinitely.

### 9. `toJWT()` vs `toJwt()` — renamed in v2.0.0

Before v2.0.0, the method was `toJWT()` (uppercase T). Since v2.0.0 it is `toJwt()` (lowercase t). Any migration from v1 must update call sites.

### 10. ESM-only since v2.0.0

`livekit-server-sdk` v2.x is ESM-only. CommonJS `require()` will fail. NestJS with `"module": "CommonJS"` in tsconfig must either:
- Switch to `"module": "NodeNext"` + `"moduleResolution": "NodeNext"`, or
- Use dynamic `const { AccessToken } = await import('livekit-server-sdk')` at initialization.

### 11. `TwirpError` replaced `LivekitError` in server SDK v2.10.0

If your error-handling code catches `LivekitError` in the server SDK, update it to `TwirpError` after upgrading to v2.10.0+. Note: `LivekitError` still exists in the client SDK (`livekit-client`) — the name change only affects the server SDK.

### 12. Unscoped grant is a security vulnerability

A token with `roomJoin: true` but no `room` set is a join-anything credential — the holder can join any room on the LiveKit server. Always set `room: channelId` explicitly. The RBAC check before token issuance ensures `channelId` is a room the user is authorized to join.

---

## Documentation Links

- Getting Started / Authentication: https://docs.livekit.io/home/get-started/authentication/
- Self-Hosting Deployment: https://docs.livekit.io/home/self-hosting/deployment/
- Self-Hosting Ports & Firewall: https://docs.livekit.io/home/self-hosting/ports-firewall/
- Token & Grants Reference: https://docs.livekit.io/frontends/reference/tokens-grants.md
- GitHub — server SDK (node-sdks monorepo): https://github.com/livekit/node-sdks
- GitHub — browser client SDK: https://github.com/livekit/client-sdk-js
- GitHub — React components: https://github.com/livekit/components-js
- GitHub — config-sample.yaml (self-host ports): https://github.com/livekit/livekit/blob/master/config-sample.yaml
- GitHub — node-sdks CHANGELOG: https://github.com/livekit/node-sdks/blob/main/packages/livekit-server-sdk/CHANGELOG.md
- GitHub — client-sdk-js releases: https://github.com/livekit/client-sdk-js/releases
- GitHub — components-js releases: https://github.com/livekit/components-js/releases
- LiveKit Cloud: https://cloud.livekit.io

---

## Integration-Specific Findings

*(added during/after implementation — what WE learned)*

### Our adapter patterns

*(to be filled at B-block)*

### Env var configuration on our platforms

Server-side env vars (Railway `api` service — NOT the `web` service):
```
LIVEKIT_URL=wss://<project-slug>.livekit.cloud     # or self-host wss:// URL
LIVEKIT_API_KEY=<cloud-issued or self-host-generated>
LIVEKIT_API_SECRET=<cloud-issued or self-host-generated>
```

Client-side env var (embedded at Vite build time — safe, not a credential):
```
VITE_LIVEKIT_URL=wss://<project-slug>.livekit.cloud
```

`LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` must NEVER appear with a `VITE_` prefix.

### Bugs we hit and how we solved them

*(to be filled at B-block)*

### What differed from the official docs

- `github.com/livekit/server-sdk-js` — this repo URL 404s; the correct current monorepo is `github.com/livekit/node-sdks`.
- `github.com/livekit/components-react` — this repo URL 404s; the correct repo is `github.com/livekit/components-js`.
- Several `docs.livekit.io` reference URLs (e.g. `/reference/components/react/`, `/home/server-sdks/server-sdk-js/`) returned 404 as of 2026-06-26. Source files on GitHub were the authoritative fallback.
- `RoomServiceClient` does NOT read env vars (unlike `AccessToken`) — constructor args are required. This is not documented prominently in the official docs.
