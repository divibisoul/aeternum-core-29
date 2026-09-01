# SOUL — Master Audit & Execution Index

Version: 1.1
Status: BASELINE / EXECUTION CONTROL

## Purpose

This document is the permanent control index for recovery and evolution of the seven SOUL nuclei. It records what is verified in GitHub, what is architectural intent, the current execution stage, and the next gate.

## Non-destructive rules

- Recover and integrate existing implementations before replacing them.
- Do not delete functioning legacy code merely to impose a new architecture.
- Existing contracts and transports must be inspected before introducing duplicates.
- A document, interface, or endpoint is not counted as functional integration until an executable test demonstrates a correlated result.
- API/cloud cognition is optional; SOUL must not require a paid external cognitive API to remain operational.
- Browser-session integration must never receive the user's password through SOUL.
- Legacy/older files are removable only after dependency, import, workflow, package, deployment and runtime analysis proves they are outside the active execution graph.

## Global execution model

AUDIT ALL SEVEN → MAP DEPENDENCIES → DEFINE CANONICAL CONTRACTS → EXECUTE ONE NUCLEUS AT A TIME → INTEGRATE → FINAL AUDIT.

## Nuclei

| ID | Repository | Role | Current gate |
|---|---|---|---|
| N01 | aeternum-core-29 | Android/device/gateway foundation | active validation |
| N02 | Eternium- | coordination/provider laboratory | active validation |
| N03 | nexus-aeternum-fusion | perception/audio/multimodal | active validation |
| N04 | nextjs-ai-chatbots | application/cognitive/tooling | active validation |
| N05 | nextjs-ai-chatbot | runtime/mesh/security reference | active validation |
| N06 | nextjs-ai-chatbot-2000 | runtime/coordination/advanced services | active validation |
| N07 | Orquestrador- | neural/prefrontal/compute/cognitive execution | backend/fusion validation |

## Gates

### G0 — Global baseline
Inventory every nucleus, protocol, transport, capability, provider, security mechanism, test suite, dependency and deployment surface. No implementation percentage is considered final until evidence is recorded.

### G1 — Capability contract
Reconcile existing capability declarations and define the canonical capability representation without deleting compatible legacy representations.

### G2 — Mesh contract
Reconcile the existing SoulMesh implementations and select/adapt a canonical envelope and transport abstraction.

### G3 — Secure communication
HMAC-SHA256 + timestamp + nonce + correlationId where supported; authentication is separate from authorization. Existing security work must be reused where compatible.

### G4–G9 — N01 through N06
Stabilize each nucleus, prove executable local behavior, then prove ownership-aware Mesh capability execution with adjacent nuclei.

### G10 — Seven-nucleus integration
Prove bidirectional capability execution across the logical SOUL topology, not merely health/ping.

### G11 — Provider independence
Local WASM/CPU/WebGPU and Browser Session are progressive providers; cloud APIs remain optional providers/fallbacks.

### G12 — N07 backend and storage
Prove the N07 backend, Supabase persistence, current Storacha upload/retrieval path, SuperGPU execution and production container.

### G13 — Final audit and online readiness
Repeat baseline measurements, verify all current HEADs and CI evidence, verify deployment configuration, then perform live runtime commissioning.

## Topology math

Seven nuclei form 21 unordered peer pairs and 42 directed logical links. With one IN and one OUT channel for every peer relationship, the federation exposes 84 channel slots.

## Progress measurement

For each nucleus and globally, track separately:

- Implementation: code exists.
- Validation: automated/manual test proves behavior.
- Integration: another nucleus executes a real capability and receives a correlated result.
- Security: authentication/authorization controls are implemented and tested.
- Architecture: implementation conforms to the canonical contract.
- Deployment: the runtime can be started with documented production configuration.

Global percentage must be evidence-based; documentation alone never counts as functional integration.

## Per-change record

Every execution cycle must record:

1. Exact repository and branch.
2. Baseline state.
3. Files inspected.
4. Problem/failure found.
5. Existing implementation reused.
6. Minimal corrective change.
7. Tests executed and result.
8. Commit SHA.
9. Post-change audit.
10. Percentage/state before/after where measurable.
11. Next gate.

## Current execution status

- Canonical federation registry: seven nuclei, version 1.5.
- Canonical Mesh contract: `soul-mesh/1`, version `1.1.0`.
- N07 backend: structurally integrated and CI-tested.
- Supabase persistence: integrated and access-restricted.
- Current Storacha path: implemented with Guppy and explicit Space/data-dir configuration; live Space commissioning remains deployment evidence.
- Legacy cleanup: active; deletion requires dependency proof.
- Final runtime E2E across all seven deployed nuclei: not yet proven.
