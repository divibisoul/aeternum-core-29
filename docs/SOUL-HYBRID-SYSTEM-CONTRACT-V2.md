# SOUL Hybrid System Contract v2

Status: reconstruction contract; additive, non-destructive.

## Invariants

- SOUL is a GPU-like parallel cognitive fabric, not a CPU.
- N01 is the Android/APK host, user-facing gateway and one of the six AI nuclei.
- N02, N03, N04, N05 and N06 are also AI nuclei; each may have a different runtime, model/session, toolchain and execution environment.
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

Every nucleus is an AI system/runtime, but no nucleus is required to be a specific commercial AI provider. AI models and authenticated browser/web sessions are implementation connectors behind a provider-neutral interface.

A nucleus may therefore communicate with another nucleus regardless of whether that peer uses a browser session, hosted API, local model, multimodal runtime, deterministic tool engine, or another hybrid mechanism.

Provider-specific clients are not required inside the Mesh protocol.

## Affinity hierarchy

- N01: Android/native host + cognitive/AI gateway
- N02: conversation and interaction
- N03: perception, voice and multimodal/context processing
- N04: tools, documents and artifacts
- N05: orchestration, dispatch and execution coordination
- N06: cognition, synthesis, audit and governance

Affinity selects preferred execution paths; it MUST NOT prohibit any of the 5x5 peer connections.

## Capability ownership

A capability has one owner. Other nuclei invoke the owner through Mesh rather than duplicating the implementation. Ownership and AI identity are separate concepts: an AI nucleus can consume capabilities from another AI nucleus while retaining its own reasoning/runtime.

## Proof standard

CONNECTED is earned only after a real request traverses transport, reaches the destination nucleus, resolves a capability, executes the real handler, and returns a correlated response. Missing route, timeout, unsupported transport, missing capability, or handler failure must remain non-success states.

## Synergy model

Each directed connection is evaluated by capability complementarity: producer -> consumer, required context, transport compatibility, AI dependency, fallback, and observable response. System synergy is the aggregate of verified pairwise flows; it is not inferred from code presence.

## Non-destructive rule

Existing capabilities, tools, providers, UI and domain modules are preserved unless a replacement is required for correctness. Replacements must retain the old capability contract or provide an explicit compatibility adapter. No deletion is justified merely to simplify the architecture.
