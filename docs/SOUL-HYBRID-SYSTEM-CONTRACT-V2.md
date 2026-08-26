# SOUL Hybrid System Contract v2

Status: active architectural contract; additive, non-destructive.

## Invariants
- SOUL is a GPU-like parallel cognitive fabric, not a CPU.
- N01 is the Android/APK host, user-facing gateway and universal access point.
- The six nuclei are N01..N06.
- Every nucleus exposes exactly 5 logical IN channels and 5 logical OUT channels to the other five nuclei.
- The topology therefore contains 30 directed OUT channels + 30 directed IN channels = 60 directional channels.
- Channel identity is independent of transport.
- A channel is NOT considered functionally connected merely because a route, endpoint, adapter, or registry exists.

## Nucleus identity
- Every nucleus is an independent AI/runtime system with its own capabilities, tools, context and implementation.
- N01 is the reference communication/host nucleus, not the owner of every capability.
- A nucleus may invoke another nucleus's capabilities without surrendering its own identity or ownership.

## Hybrid transport contract
A channel may negotiate a transport appropriate to its runtime: IN_PROCESS, WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP, or REALTIME. The transport is an implementation detail; the logical channel identity remains stable.

## Universal APK gateway
N01 is the user-facing gateway. A capability may execute in any nucleus while the request enters and the result returns through N01. N01 does not acquire ownership of another nucleus's capability.

Flow: user -> APK/N01 -> Pilot/router -> owning nucleus -> real handler -> response -> N01 -> user.

## AI boundary
Each nucleus may contain and operate its own AI runtime/provider integration. AI-dependent capabilities MUST resolve through an abstract provider/session interface so that nuclei remain provider-agnostic at the protocol boundary. A nucleus may consume another nucleus's AI capability through the inter-AI protocol without embedding or duplicating the provider implementation.

## Affinity hierarchy
- N01: Android/runtime/host integration
- N02: conversation and interaction
- N03: perception, voice and multimodal/context processing
- N04: tools, documents and artifacts
- N05: orchestration, dispatch and execution coordination
- N06: cognition, synthesis, audit and governance

Affinity selects preferred execution paths; it MUST NOT prohibit any of the 5x5 peer connections.

## Communication semantics
The reference protocol carries identity, capability, context requirements, authorization, tool metadata, execution requests, acknowledgements, correlated results and structured errors. Transport is negotiated independently of capability identity.

## Functional proof
Functional AI-to-AI communication is established by a real capability transaction:
1. discover capability metadata;
2. negotiate a compatible transport/protocol;
3. authorize the operation;
4. send a capability request;
5. resolve the destination runtime and real handler;
6. execute the capability;
7. return a correlated structured result or explicit error;
8. make the result observable to the requesting nucleus.

Ping and health are diagnostics only. They MUST NOT be used as functional connection proof.

## Synergy model
Each directed connection is evaluated by capability complementarity: producer -> consumer, required context, transport compatibility, AI dependency, tool dependencies, fallback, and observable response. System synergy is the aggregate of working pairwise flows; it is not inferred from code presence.

## Wiring principle
The contract is an engineering specification, not an operational blockade. When an implementation satisfies the interfaces and ownership rules, the system should work when activated. Tests validate the plumbing and expose defects; they must not become artificial gates that prevent otherwise valid capabilities from operating.

## Non-destructive rule
Existing capabilities, tools, providers, UI and domain modules are preserved unless a replacement is required for correctness. Replacements must retain the old capability contract or provide an explicit compatibility adapter. No deletion is justified merely to simplify the architecture.
