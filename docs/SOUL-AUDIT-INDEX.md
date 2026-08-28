# SOUL — Master Audit & Execution Index

Version: 1.0
Status: BASELINE / EXECUTION CONTROL

## Purpose

This document is the permanent control index for recovery and evolution of the six SOUL nuclei. It records what is verified in GitHub, what is only architectural intent, the current execution stage, and the next gate.

## Non-destructive rules

- Recover and integrate existing implementations before replacing them.
- Do not delete functioning legacy code merely to impose a new architecture.
- Existing contracts and transports must be inspected before introducing duplicates.
- A document, interface, or endpoint is not counted as functional integration until an executable test demonstrates a correlated result.
- API/cloud cognition is optional; SOUL must not require a paid external cognitive API to remain operational.
- Browser-session integration must never receive the user's password through SOUL.

## Global execution model

AUDIT ALL SIX → MAP DEPENDENCIES → DEFINE CANONICAL CONTRACTS → EXECUTE ONE NUCLEUS AT A TIME → INTEGRATE → FINAL AUDIT.

## Nuclei

| ID | Repository | Role | Current gate |
|---|---|---|---|
| N01 | aeternum-core-29 | Android/device/gateway foundation | G0 baseline |
| N02 | Eternium- | coordination/provider laboratory | G0 baseline |
| N03 | nexus-aeternum-fusion | perception/audio/multimodal | G0 baseline |
| N04 | nextjs-ai-chatbots | application/cognitive/tooling | G0 baseline |
| N05 | nextjs-ai-chatbot | runtime/mesh/security reference | G0 baseline |
| N06 | nextjs-ai-chatbot-2000 | runtime/coordination/advanced services | G0 baseline |

## Gates

### G0 — Global baseline
Inventory every nucleus, protocol, transport, capability, provider, security mechanism, test suite, and dependency. No implementation percentage is considered final until evidence is recorded.

### G1 — Capability contract
Reconcile existing capability declarations and define the canonical capability representation without deleting compatible legacy representations.

### G2 — Mesh contract
Reconcile the multiple existing SoulMesh implementations and select/adapt a canonical envelope and transport abstraction.

### G3 — Secure communication
HMAC-SHA256 + timestamp + nonce + correlationId; authentication is separate from authorization. Existing N05 security work must be reused where technically compatible.

### G4 — N01
Stabilize gateway/bridge/capability discovery and prove an executable bidirectional transaction.

### G5 — N02
Integrate N02 with the canonical capability and mesh contracts and isolate cognitive providers.

### G6 — N03
Integrate perception/audio capabilities through the same contracts.

### G7 — N04
Integrate application/tool/cognitive capabilities.

### G8 — N05
Preserve and consolidate its existing mesh/security work as appropriate.

### G9 — N06
Integrate runtime/coordination capabilities.

### G10 — Six-nucleus integration
Prove bidirectional capability execution across the logical SOUL topology, not merely health/ping.

### G11 — Provider independence
Local WASM/CPU/WebGPU and Browser Session are progressive providers; cloud APIs remain optional fallbacks/providers.

### G12 — Final audit
Repeat the same measurements used at baseline and publish before/after evidence.

## Progress measurement

For each nucleus and globally, track separately:

- Implementation: code exists.
- Validation: automated/manual test proves behavior.
- Integration: another nucleus executes a real capability and receives a correlated result.
- Security: authentication/authorization controls are implemented and tested.
- Architecture: implementation conforms to the canonical contract.

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
10. Percentage before/after.
11. Next gate.

## Current execution status

- Master index: CREATED as an auditable project-control artifact.
- New destructive changes: NONE.
- Global architecture: established from existing contracts and repository evidence.
- Next operation: complete G0 evidence matrix across N01–N06 before structural refactoring.
