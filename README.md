# N01 — Soul Mesh Host / Android AGI Core

N01 is the host/reference nucleus of the Soul hybrid architecture. The six nuclei are independent AI runtimes that cooperate through Soul Mesh to form one distributed intelligence. N01 is designed to evolve from the current web/runtime foundation into an Android APK with HTTP, WebSocket and native transport adapters.

## N01 5 × 5 communication fabric

Five independent inbound channels receive traffic from the other nuclei:

- `N01_IN_N02` → `/mesh/in/N02`
- `N01_IN_N03` → `/mesh/in/N03`
- `N01_IN_N04` → `/mesh/in/N04`
- `N01_IN_N05` → `/mesh/in/N05`
- `N01_IN_N06` → `/mesh/in/N06`

Five independent outbound channels send traffic to the same peers:

- `N01_OUT_N02` → peer N02, `/mesh/in/N01`
- `N01_OUT_N03` → peer N03, `/mesh/in/N01`
- `N01_OUT_N04` → peer N04, `/mesh/in/N01`
- `N01_OUT_N05` → peer N05, `/mesh/in/N01`
- `N01_OUT_N06` → peer N06, `/mesh/in/N01`

Channel identity is independent from transport technology. The current HTTP adapter is replaceable by WebSocket or Android-native transport without changing channel IDs or routing contracts.

## Mesh routing

Every inbound message must use the `soul-mesh/1` protocol, identify the expected peer as `source`, and target `N01`. The canonical `SoulMeshRouter` now exposes an ingress method for server, WebSocket or Android adapters. Outbound routing resolves the peer through the persistent discovery registry and sends through the peer-specific transport adapter.

## Registration and capabilities

A peer registration contains its peer ID, endpoint and capability advertisement. N01 validates capability ownership and records the remote capability set in its canonical capability registry. Discovery keeps the hot in-memory cache synchronized with durable browser storage.

## Authentication

Each peer receives a unique N01-issued session token. Tokens are maintained per peer and persisted by the browser foundation; Android builds should move the same records to Android Keystore/secure storage. Inbound adapters must provide `Authorization: Bearer <token>` and N01 rejects missing, invalid or expired credentials. Production deployments can later replace the session-token foundation with an asymmetric scheme such as JWT/mTLS without changing channel identities.

## Manual diagnostic

Run:

```bash
npm run mesh:diagnose
```

The diagnostic emits JSON for N02–N06 with `PASS`, `FAIL`, `TIMEOUT` or `NOT_REGISTERED`. It attempts `mesh.echo` and an event requiring a correlated response within 3 seconds. Set `SOUL_MESH_PEERS_JSON` to a JSON object containing each peer's `endpoint` and optional `token` when running the standalone Node diagnostic, for example:

```json
{
  "N02": { "endpoint": "https://peer-n02.example" },
  "N03": { "endpoint": "https://peer-n03.example" }
}
```

The standalone diagnostic cannot inspect a browser's IndexedDB directly; the live application/Android adapter remains the authority for its persistent peer registry.

## APK readiness

The Mesh channel layer is deliberately separated from transport details. The current web runtime can use the existing Supabase/HTTP mechanisms, while a future APK can bind the same contracts to Capacitor/WebView and Android-native networking. Device integrations such as camera, microphone and Shizuku belong above the transport layer and remain isolated from the peer-channel contract.

## Environment

Keep existing application/provider credentials in the deployment environment, including `GEMINI_API_KEY` when the current AI integration requires it. Do not place long-lived Mesh secrets in public `VITE_*` variables. Peer discovery data and per-peer authentication material should be managed by the runtime's secure persistence layer.

## Current integration state

The N01 5 × 5 channel identities, canonical router ingress, discovery persistence, per-peer session-token foundation, capability registration and manual diagnostic are installed on the N01 upgrade branch. End-to-end communication with N02–N06 remains dependent on each future nucleus exposing its corresponding N01 input endpoint/adapter and diagnostic acknowledgement capability. N01 does not claim connectivity merely from static configuration.
