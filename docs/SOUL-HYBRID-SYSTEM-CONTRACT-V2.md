# SOUL Hybrid System Contract v2

Status: reconstruction contract; additive, non-destructive.

## Invariants
- SOUL is a GPU-like parallel cognitive fabric, not a CPU.
- N01 is the Android/APK host, user-facing gateway and universal access point.
- The six nuclei are N01..N06.
- Every nucleus exposes exactly 5 logical IN channels and 5 logical OUT channels to the other five nuclei.
- The topology therefore contains 30 directed OUT channels + 30 directed IN channels = 60 directional channels.
- Channel identity is independent of transport.
- A channel is NOT considered connected merely because a route, endpoint, adapter, or registry exists.

## Hybrid transport contract
A channel may negotiate a transport appropriate to its runtime: IN_PROCESS, WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP, or REALTIME. The transport is an implementation detail; the logical channel identity remains stable.

## Universal APK gateway
N01 is the user-facing gateway. A capability may execute in any nucleus while the request enters and the result returns through N01. N01 does not acquire ownership of another nucleus's capability.

Flow: user -> APK/N01 -> Pilot/router -> owning nucleus -> real handler -> response -> N01 -> user.

## AI boundary
No nucleus is itself an AI provider. AI-dependent capabilities resolve an abstract Soul AI Provider/Web Session. A provider must be authenticated/attached by the runtime; no provider-specific client is required inside a nucleus.

## Affinity hierarchy
- N01: Android/runtime/host integration
- N02: conversation and interaction
- N03: perception, voice and multimodal/context processing
- N04: tools, documents and artifacts
- N05: orchestration, dispatch and execution coordination
- N06: cognition, synthesis, audit and governance

Affinity selects preferred execution paths; it MUST NOT prohibit any of the 5x5 peer connections.

## Proof standard
CONNECTED is earned only after a real request traverses transport, reaches the destination nucleus, resolves a capability, executes the real handler, and returns a correlated response. Missing route, timeout, unsupported transport, missing capability, or handler failure must remain non-success states.

## Synergy model
Each directed connection is evaluated by capability complementarity: producer -> consumer, required context, transport compatibility, AI dependency, fallback, and observable response. System synergy is the aggregate of verified pairwise flows; it is not inferred from code presence.

## Non-destructive rule
Existing capabilities, tools, providers, UI and domain modules are preserved unless a replacement is required for correctness. Replacements must retain the old capability contract or provide an explicit compatibility adapter. No deletion is justified merely to simplify the architecture.
