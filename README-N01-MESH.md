# N01 — Soul Mesh / Android AGI Host

N01 is the host/reference nucleus of the Soul hybrid architecture. Each nucleus remains an independent AI/runtime, while Soul Mesh provides interoperable communication, discovery, capabilities, authentication and transport abstraction.

## 5 IN + 5 OUT channels

| Peer | IN channel | IN route | OUT channel | OUT destination |
|---|---|---|---|---|
| N02 | N01_IN_N02 | `/mesh/in/N02` | N01_OUT_N02 | peer N02 `/mesh/in/N01` |
| N03 | N01_IN_N03 | `/mesh/in/N03` | N01_OUT_N03 | peer N03 `/mesh/in/N01` |
| N04 | N01_IN_N04 | `/mesh/in/N04` | N01_OUT_N04 | peer N04 `/mesh/in/N01` |
| N05 | N01_IN_N05 | `/mesh/in/N05` | N01_OUT_N05 | peer N05 `/mesh/in/N01` |
| N06 | N01_IN_N06 | `/mesh/in/N06` | N01_OUT_N06 | peer N06 `/mesh/in/N01` |

All channels use the `soul-mesh/1` envelope and are technology-independent. The router validates source/target identity and dispatches to the appropriate channel.

## Registration and authentication

A peer registers its `peerId`, endpoint and `capabilities[]`. N01 issues a unique session token for that peer. Tokens are kept per peer and must be supplied as `Authorization: Bearer <token>` on subsequent authenticated operations. For an Android APK, token material should move to Android Keystore/secure storage rather than browser persistence.

## State of integration

The N01 5×5 channel structure is installed. Real end-to-end communication requires the corresponding receiving channels in N02–N06. Until those peers expose their N01 input channels and acknowledge events, N01 diagnostics must report `NOT_REGISTERED`, `TIMEOUT` or `FAIL` rather than claiming connectivity.

## Manual diagnostic

`scripts/mesh-diagnose.ts` is a host-runtime diagnostic. It checks registration and, for each peer, attempts inbound probing, `mesh.echo`, and an event requiring a response with the same correlation ID, using a 3-second timeout. It emits JSON with `PASS`, `FAIL`, `TIMEOUT`, or `NOT_REGISTERED` for each channel.

The script requires a runtime adapter named `globalThis.soulMeshDiagnostic` exposing `isRegistered`, `probeInbound`, `echo`, and `eventWithConfirmation`. This keeps the diagnostic independent of browser, WebSocket, HTTP or future Android-native transport.

## APK transport evolution

Transport is isolated behind adapters. HTTP is the current interoperable transport; WebSocket and native Android transport can be added without changing the channel identities or router contracts. In the APK, the web layer may run through Capacitor/WebView while native Android adapters provide device networking and future integrations such as camera, microphone and Shizuku.

## Environment

Provider/API credentials remain deployment-specific. If Gemini is enabled by the existing application, configure its existing `GEMINI_API_KEY` mechanism. Mesh peer endpoints and persistent discovery configuration must be supplied by the deployment/runtime. No placeholder project identifiers are required by this document.
