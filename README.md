# N01 — Soul Mesh Host / Android AGI Core

N01 is the host/reference nucleus of the Soul hybrid architecture. The six nuclei are independent AI runtimes that cooperate through Soul Mesh to form one distributed intelligence. N01 is being built as the first floor of the system: its complete channel, routing, discovery, authentication and transport foundation is established before work proceeds to N02.

## N01 5 × 5 communication fabric

Five independent inbound channels receive traffic from the other nuclei:

- `N01_IN_N02` → `POST /mesh/in/N02`
- `N01_IN_N03` → `POST /mesh/in/N03`
- `N01_IN_N04` → `POST /mesh/in/N04`
- `N01_IN_N05` → `POST /mesh/in/N05`
- `N01_IN_N06` → `POST /mesh/in/N06`

Five independent outbound channels send traffic to the same peers:

- `N01_OUT_N02` → peer N02, `/mesh/in/N01`
- `N01_OUT_N03` → peer N03, `/mesh/in/N01`
- `N01_OUT_N04` → peer N04, `/mesh/in/N01`
- `N01_OUT_N05` → peer N05, `/mesh/in/N01`
- `N01_OUT_N06` → peer N06, `/mesh/in/N01`

Channel identity is independent from transport technology. The current HTTP adapter can later be replaced by WebSocket or Android-native transport without changing channel IDs or routing contracts.

## Development HTTP ingress

Vite's development server is extended with a Mesh middleware. The five `/mesh/in/Nxx` routes are real HTTP `POST` routes while the Vite dev server is running. Each route parses a Soul Mesh envelope, validates source/target identity and the peer's Bearer token, then calls the canonical `SoulMeshRouter.ingest()` through `N01MeshIngress`. Invalid credentials return HTTP 401.

The dev middleware also exposes `/mesh/dev/register/Nxx` and `/mesh/mock-peer/Nxx`. These are **development-only test fixtures**. They allow the browser diagnostic to provision mock peer credentials and exercise the complete HTTP IN/OUT path without modifying N02–N06. They must not be treated as production peer endpoints.

Vite documents `configureServer` as the mechanism for adding custom middleware to its development server. The production APK will replace this adapter with an Android-native HTTP/WebSocket service. citeturn1search0turn1search2

## Mesh routing

Every inbound message must use `soul-mesh/1`, identify the expected peer as `source`, and target `N01`. `N01MeshIngress` delegates to the one canonical `SoulMeshRouter`. `N01MeshChannelFabric` owns the five logical OUT channels and resolves each peer through the persistent discovery registry. HTTP responses are fed back into the canonical router so `request()` and `sendEventAndWait()` can complete by correlation ID.

## Registration and capabilities

A peer registration contains its peer ID, endpoint and capability advertisement. N01 validates capability ownership and records the remote capability snapshot without inventing metadata. Discovery keeps a hot in-memory cache synchronized with durable browser IndexedDB storage.

## Authentication

Each peer receives a unique N01-issued session token. Browser tokens are persisted per peer in IndexedDB and hydrated before the N01 runtime accepts traffic. Inbound adapters require `Authorization: Bearer <token>`. The dev diagnostic also verifies that an invalid token is rejected with HTTP 401. Android builds should move the same records to Android Keystore/secure storage.

## Diagnostic — IndexedDB-backed

Run:

```bash
npm run mesh:diagnose
```

This starts the Vite development server and opens `mesh-diagnose.html`. The diagnostic runs **inside the browser**, so it uses the real `IndexedDBDiscoveryAdapter` rather than `SOUL_MESH_PEERS_JSON`. For N02–N06 it:

1. Hydrates the peer list from IndexedDB.
2. Provisions a development mock peer only when that peer is not registered.
3. Persists the mock endpoint/token in IndexedDB.
4. Tests the corresponding N01 IN endpoint with a valid token.
5. Tests the same IN endpoint with an invalid token and expects 401.
6. Tests the OUT channel through `SoulMeshDiscoveryRegistry → N01MeshChannelFabric → SoulMeshHttpTransport → mock peer`.
7. Uses the canonical `SoulMeshRouter.sendEventAndWait()` for the event/ACK test with a 3-second timeout.
8. Prints JSON containing `PASS`, `FAIL`, `TIMEOUT` or `NOT_REGISTERED` for every peer.

This is the correct browser-side diagnostic because Node does not provide the browser IndexedDB API used by the N01 persistence adapter. The future Android diagnostic will bind the same diagnostic contract to secure native storage.

## APK transition

The web implementation is a development/validation layer, not the final network host. In the APK, the five logical IN channels remain unchanged but their HTTP/WebSocket binding moves to a native Android service. The OUT channels continue to consume the same `SoulMeshTransport` contract. Android Keystore replaces browser token persistence; native networking replaces the Vite middleware. Camera, microphone, Shizuku and other device capabilities remain above the Mesh transport layer.

## Environment

The application retains its existing provider configuration, including `GEMINI_API_KEY` when required by the existing AI integration. Mesh secrets must not be placed in public `VITE_*` variables. The development diagnostic requires no `SOUL_MESH_PEERS_JSON` variable.

## Current integration state

The N01 5 × 5 identities, canonical router ingress, persistent discovery, capability registration, per-peer authentication, Vite development HTTP ingress and IndexedDB-backed diagnostic are installed on this branch. End-to-end communication with the real N02–N06 remains intentionally **unclaimed** until those nuclei expose their corresponding endpoints. The mock harness validates N01's plumbing without modifying any other nucleus.
