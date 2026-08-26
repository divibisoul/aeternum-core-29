# N01 ↔ N02 Soul Mesh Integration — 2026-08-26

## Audit result
N01 has a native Android/WebView hybrid runtime and an existing Soul Mesh stack. The canonical wire layer was audited before integration.

## Compatibility fixes
- Canonical protocol remains `soul-mesh/1`.
- Nucleus identity is `N01` / `N02`.
- `timestamp` is now a JSON number containing epoch milliseconds, matching the TypeScript Mesh contract used by N02.
- `ack` is accepted as a valid message kind.
- Request/response/error messages require a capability.
- Payload size is bounded to 2 MiB.
- Message timestamps are rejected when outside a 5-minute clock-skew window.
- Correlation IDs are preserved end-to-end.

## N01 → N02 integration
N01 now has:
- `SoulMeshPeerConfig` for the independently deployed N02 endpoint;
- `SoulMeshRemoteClient.request()` for capability RPC;
- `SoulMeshRemoteClient.pingN02()` for connectivity probing;
- build-time injection through `SOUL_MESH_N02_URL`;
- Android instrumentation coverage for a real HTTP request/response path using the canonical message format.

## Deployment boundary
The N02 URL is intentionally not invented or hard-coded. It must be supplied by the deployment environment as `SOUL_MESH_N02_URL` (or GitHub Actions repository variable of the same name).

## Proof status
Code-level protocol compatibility: PASS.
Local transport request → receiver → handler → correlated response: covered by Android instrumentation test.
Live N01 → deployed N02: UNVERIFIED until a real N02 deployment URL is supplied and reachable.

## Architectural invariant
N01 remains the user-facing gateway and does not take ownership of N02 capabilities. N02 remains an independent AI nucleus. Remote capabilities execute in their owning nucleus and return a correlated result through Soul Mesh.
