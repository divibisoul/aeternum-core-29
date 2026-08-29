# N01 — Implementation Closeout V2

Status: implementation consolidated; runtime verification remains a separate state.

## Canonical role

N01 is the Android/APK host, user-facing gateway and canonical communication reference. It does not own capabilities belonging to N02–N06.

## Communication layers present in the repository

- WebView/Android bridge
- in-process routing
- configurable HTTP peer transport
- Android HTTP listener
- Mesh RPC correlation
- Mesh protocol validation
- peer endpoint registry
- 60-channel logical access model
- capability registry/discovery
- health/handshake infrastructure
- Supabase transport components already present in the repository

## Corrections applied in this closeout

1. Android Mesh message kinds were aligned with the canonical wire contract: request, response, event, error.
2. The old Android-only `ack` kind was removed from the validation contract; RPC accepts only canonical response/error completion messages.
3. Android Mesh timestamps were normalized to epoch milliseconds so the Kotlin wire model matches the TypeScript canonical protocol.
4. Mesh responses now carry `contractVersion`.
5. The Android HTTP listener returns a canonical `response`, not a non-canonical `ack`.
6. Bootstrap now accepts a peer endpoint map, preserving the existing one-argument API through a default parameter.
7. Web-session delegation now returns a canonical `response`.
8. Existing native capabilities and ownership remain intact.

## Important runtime rule

An empty peer endpoint map is intentionally not treated as a connected peer. Deployment endpoints must be supplied by the host/runtime configuration. This prevents a false-positive claim of six-nucleus connectivity.

## Transport truth table

| Layer | Source evidence | State |
|---|---|---|
| In-process | `SoulHybridTransport` | IMPLEMENTED |
| WebView bridge | `SoulHybridBridge` | IMPLEMENTED |
| HTTP outbound | `SoulMeshTransport` / `SoulMeshHttpTransport` | IMPLEMENTED |
| HTTP inbound | `SoulMeshHttpTransport.start*` | IMPLEMENTED |
| RPC correlation | `SoulMeshRpc` | IMPLEMENTED |
| Peer endpoint model | `SoulMeshPeerEndpoints` | IMPLEMENTED |
| 60 logical channels | `SoulMesh60ChannelAccess` / channel matrix | IMPLEMENTED |
| Runtime E2E with all peers | requires deployment/runtime | UNVERIFIED |

## Completion gate

N01 source implementation is consolidated for the inspected communication stack. It must not be labeled `E2E VERIFIED` until an executable environment demonstrates real capability transactions through the intended transports.

The engineering work does not stop merely because runtime execution is unavailable; the implementation state and runtime-verification state remain explicitly separate.
