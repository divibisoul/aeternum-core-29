# SOUL — Reconstruction & Optimization Plan

Date: 2026-08-26
Branch: `soul-reconstruction-2026-08-26`

## Non-negotiable architecture

- SOUL is a hybrid GPU-like cognitive fabric, not a CPU.
- There are 6 nuclei: N01..N06.
- Every nucleus exposes 5 logical IN ports and 5 logical OUT ports.
- The mesh therefore contains 30 IN + 30 OUT = 60 directional logical connections.
- The 60 channels are logical communication ports, not a claim of 60 simultaneously open sockets.
- Every logical channel must support hybrid transport negotiation so native Android, WebView, local/in-process and network/server-backed runtimes can participate in one system.
- N01 is the user-facing hybrid APK/host and universal gateway: the APK must be able to invoke capabilities owned by any nucleus through the canonical gateway, subject to capability ownership and execution policy.
- AI is not bundled into a nucleus. AI is supplied later through a user-authenticated Web Session / Pilot provider boundary; nucleus capabilities must remain useful without a built-in model.
- Existing capabilities/tools are preserved by capability, but faulty implementations may be replaced.
- The AI Pilot/Cockpit is a cross-cutting control/orchestration layer, not a CPU-like bottleneck.

## Hybrid transport model

Each IN/OUT logical port can negotiate an available transport from the canonical set:

1. `WEBVIEW_BRIDGE` — APK/WebView boundary.
2. `LOOPBACK_HTTP` — same-device local runtime.
3. `HTTP` — network/server-backed nucleus runtime.
4. `REALTIME` — realtime/event transport when available.
5. `IN_PROCESS` — direct runtime dispatch when nuclei are co-hosted.

Transport choice is an implementation detail of the channel. The logical channel identity, message contract, correlation ID and delivery semantics remain invariant.

The APK gateway must not assume that every nucleus is running inside the APK. It selects local, WebView, loopback or remote transport according to the live endpoint registry.

## Execution order and checkpoints

1. **Canonical identity N01..N06 — COMPLETE/IN PROGRESS**
2. **Legacy peer-name removal — IN PROGRESS**
3. **One Mesh contract/topology — IN PROGRESS**
4. **5-IN/5-OUT + 60-channel model — COMPLETE at contract level**
5. **Hybrid channel transport contract — IN PROGRESS**
6. **Universal N01 APK gateway — IN PROGRESS**
7. **Affinity/hierarchy — COMPLETE at routing-policy level**
8. **Capability/tool inventory — IN PROGRESS**
9. **Real dispatch — PARTIALLY COMPLETE**
10. **Provider-neutral AI — PARTIALLY COMPLETE**
11. **AI Pilot/Cockpit — NEXT**
12. **Authenticated inter-nucleus transport — IN PROGRESS**
13. **True E2E tests — NEXT**
14. **60-channel verification — FINAL GATE**
15. **APK/system acceptance build — FINAL GATE**

## Affinity model

- N01 — runtime/device/Android foundation and universal user gateway
- N03 — perception, multimodal context, voice/sensory processing
- N02 — conversation and interaction
- N04 — tools, documents, artifacts
- N05 — orchestration, dispatch, execution coordination
- N06 — deep cognition, synthesis, governance/evolution

Affinity is routing metadata. It does not impose CPU-like serialization. Parallel execution remains permitted whenever dependencies allow it.

## Universal APK rule

A user-facing action is not restricted to the nucleus that owns the capability. N01 exposes a gateway that can address any registered nucleus capability. Ownership determines where execution occurs; N01 determines how the user reaches it.

## Verification rule

No route is considered connected because a matrix contains a route entry. A route is connected only after a real transport call reaches the target endpoint and the target executes a registered capability, with a correlated response or an explicit capability/transport error.

No capability is considered restored merely because its name appears in a registry. It must have an executable handler or an explicit, documented provider boundary.

## Preservation rule

- Do not delete working functionality merely to simplify the architecture.
- Do not silently disable a capability.
- If an implementation is faulty, replace it with a functional implementation while retaining the capability contract.
- Do not introduce Gemini as a required provider.
- Provider-specific integrations remain replaceable adapters, never nucleus identity.

## Change-control rule

- All reconstruction changes are made on the isolated reconstruction branch first.
- Every commit maps to a numbered checkpoint above.
- Re-read every changed file from GitHub after writing it.
- A green status means verified evidence, not intended behavior.
- If execution cannot be proven from repository evidence, mark it `UNVERIFIED` rather than claiming success.
