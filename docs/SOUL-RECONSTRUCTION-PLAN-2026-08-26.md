# SOUL — Reconstruction & Optimization Plan

Date: 2026-08-26
Branch: `soul-reconstruction-2026-08-26`

## Non-negotiable architecture

- SOUL is a hybrid GPU-like cognitive fabric, not a CPU.
- There are 6 nuclei: N01..N06.
- Every nucleus exposes 5 logical IN ports and 5 logical OUT ports.
- The mesh therefore contains 30 IN + 30 OUT = 60 directional logical connections.
- AI is not bundled into a nucleus. AI is supplied later through a user-authenticated Web Session / Pilot provider boundary; nucleus capabilities must remain useful without a built-in model.
- Existing capabilities/tools are preserved by capability, but faulty implementations may be replaced.
- The AI Pilot/Cockpit is a cross-cutting control/orchestration layer, not a CPU-like bottleneck.

## Execution order and checkpoints

1. **Canonical identity N01..N06 — COMPLETE/IN PROGRESS**
   - Canonical IDs are now used by the new topology definitions.
2. **Legacy peer-name removal — IN PROGRESS**
   - N02, N04 and N05 mesh matrices/protocols are being migrated from legacy names.
3. **One Mesh contract/topology — IN PROGRESS**
   - Canonical `soul-mesh/1` protocol and six-nucleus topology are now present in N01, N02, N03, N04, N05 and N06 branches.
4. **5-IN/5-OUT + 60-channel model — COMPLETE at contract level**
   - N01 contains the canonical 60-directional-channel manifest; each nucleus topology defines five peers per direction.
5. **Affinity/hierarchy — COMPLETE at routing-policy level**
   - Affinity groups and priorities are defined as routing metadata, not as a serial parent-child tree.
6. **Capability/tool inventory — IN PROGRESS**
   - N02/N04/N05 tool boundaries have been corrected where stale nucleus names were masking ownership.
7. **Real dispatch — PARTIALLY COMPLETE**
   - N02, N04 and N05 no longer return a fake `processed: true` response for their Mesh HTTP endpoints; they dispatch to registered handlers and return correlated responses/errors.
8. **Provider-neutral AI — PARTIALLY COMPLETE**
   - N06's legacy Gemini service is now a compatibility boundary that requires an injected runtime provider; no Gemini client is instantiated there.
9. **AI Pilot/Cockpit — NEXT**
   - Build the supervisory Pilot and Cockpit after the transport/identity contract is stable.
10. **Authenticated inter-nucleus transport — NEXT**
    - Configurable peer endpoint transports are present for N02/N03/N04/N05/N06; N01 Android/loopback integration remains to be wired into the canonical contract.
11. **True E2E tests — NEXT**
    - Contract tests must be expanded to prove real request -> transport -> target -> handler -> response.
12. **60-channel verification — NEXT**
    - The final gate will verify all 60 directional channels and all capability declarations against live endpoints.

## Affinity model

- N01 — runtime/device/Android foundation
- N03 — perception, multimodal context, voice/sensory processing
- N02 — conversation and interaction
- N04 — tools, documents, artifacts
- N05 — orchestration, dispatch, execution coordination
- N06 — deep cognition, synthesis, governance/evolution

Affinity is routing metadata. It does not impose CPU-like serialization.

## Verification rule

No route is considered connected because a matrix contains a route entry. A route is connected only after a real transport call reaches the target endpoint and the target executes a registered capability, with a correlated response or an explicit capability/transport error.

## Current implementation policy

- Preserve working capabilities.
- Replace broken/stub implementations where necessary.
- Do not introduce Gemini as a required provider.
- Do not claim a connection until it has an executable transport path.
- Re-read every changed file from GitHub after writing it.
- No random edits: every commit must map to a numbered checkpoint above.
