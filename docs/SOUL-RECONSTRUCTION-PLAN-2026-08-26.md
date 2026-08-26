# SOUL — Reconstruction & Optimization Plan

Date: 2026-08-26

## Non-negotiable architecture

- SOUL is a hybrid GPU-like cognitive fabric, not a CPU.
- There are 6 nuclei: N01..N06.
- Every nucleus exposes 5 logical IN ports and 5 logical OUT ports.
- The mesh therefore contains 30 IN + 30 OUT = 60 directional logical connections.
- AI is not bundled into a nucleus. AI is supplied later through a user-authenticated Web Session / Pilot provider boundary; nucleus capabilities must remain useful without a built-in model.
- Existing capabilities/tools are preserved by capability, but faulty implementations may be replaced.
- The AI Pilot/Cockpit is a cross-cutting control/orchestration layer, not a CPU-like bottleneck.

## Execution order

1. Freeze and document the canonical identity of N01..N06.
2. Replace legacy peer names with canonical N01..N06 IDs without deleting capabilities.
3. Define one Soul Mesh protocol contract and one topology model across all six repositories.
4. Define the 5-IN/5-OUT port contract and the 60 directional logical channels.
5. Define affinity/hierarchy metadata without turning the mesh into a serial parent-child tree.
6. Inventory every capability/tool and make the capability registry reflect real executable functions.
7. Replace acknowledgement/stub endpoints with real local capability dispatch where execution is available.
8. Introduce a provider-neutral AI boundary (Web Session/Pilot); do not add Gemini or any other mandatory AI provider.
9. Integrate the AI Pilot/Cockpit as a supervisory layer over the GPU fabric.
10. Add authenticated, configurable inter-nucleus transport with correlation IDs, timeouts, and health checks.
11. Add E2E tests that prove request -> target nucleus -> real handler -> response.
12. Verify all 60 channels and all capability declarations before merging.

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

## Change policy

Work is performed on branch `soul-reconstruction-2026-08-26`. Each optimization is committed with a focused message and must be re-read from GitHub after writing. No random edits; every change maps to an item above.
