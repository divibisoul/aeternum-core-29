# Soul Hybrid System Contract — 2026-08-26

## Non-negotiable architecture

Soul is a GPU-like parallel cognitive fabric, not a CPU and not an AI provider. N01 is the user-facing Android APK and universal gateway into the complete fabric.

The six nuclei are N01..N06. Every nucleus has exactly five logical IN channels and five logical OUT channels: 30 IN + 30 OUT = 60 directional channels system-wide. The 60 channels must remain available; they are not to be collapsed into 30.

## Hybrid transport

A logical channel is transport-neutral. A channel may use an in-process bridge, Android/WebView bridge, loopback HTTP, HTTP(S), or realtime transport according to deployment. Transport selection must never redefine nucleus ownership.

## Universal APK rule

The N01 APK must expose all capabilities of the whole fabric to the user. A capability remains owned/executed by its specialist nucleus, while N01 routes the request and returns the result. N01 is the gateway, not a replacement for the other nuclei.

## AI rule

No nucleus owns a mandatory AI provider. An AI session may be established by the user through the APK WebView/browser session. Provider credentials are not hard-coded into the nucleus mesh. A tool that requires AI consumes the active Soul AI provider/session abstraction; it must not silently report success when no provider is available.

## Hierarchy and affinity

Hierarchy is functional, not restrictive. The Pilot/Cockpit selects specialists by capability affinity while preserving peer-to-peer communication between every nucleus pair. Current affinity: N01 runtime/gateway; N02 conversation; N03 perception/multimodal/context; N04 tools/documents/artifacts; N05 orchestration/dispatch; N06 cognition/synthesis/governance.

## Proof standard

A declared route, registry entry, health flag, or adapter is not proof of connectivity. A channel is VERIFIED only after a real request traverses the selected transport, reaches the destination runtime, invokes a real handler, returns a correlated response, and passes validation. If that evidence is unavailable, the system must report the precise missing evidence rather than fabricate success.

## Synergy validation

Every connection has an explicit functional purpose. Validation must test not only transport but also capability compatibility, ownership, request/response correlation, fallback behavior, and the useful composition produced by the pair. System-level validation must include multi-hop and parallel dispatch through the Pilot.

## Preservation rule

Existing useful capabilities, tools, UI, cognitive modules, and providers are preserved. Defective implementations may be replaced behind stable capability contracts. No capability is removed merely to simplify the mesh.
