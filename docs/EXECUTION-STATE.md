# SOUL — LIVE EXECUTION STATE

Last updated: 2026-09-28

This is the execution control board. An item cannot remain OPEN without a concrete next action. Every completed item requires repository evidence and validation evidence.

## Current floor: N01

| ID | Stage | Status | Done | Remaining | Why not complete |
|---|---|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Existing N01 structure, Mesh registry, transports, provider/bridge direction inspected | None | Closed |
| N01-02 | Capability Graph | IMPLEMENTED / TEST ADDED | CapabilityGraph.ts exists with ownership, status, cost, privacy, dependencies and permissions | Runtime exposure | Focused foundation test added; live peer proof remains open |
| N01-03 | CognitiveProvider contract | IMPLEMENTED / VALIDATION OPEN | Provider-neutral local/browser/cloud contract + fallback exists | Concrete local provider + tests | Dependency choice deferred until transport path is stable |
| N01-04 | Browser Session bridge | IMPLEMENTED / VALIDATION OPEN | Session states and correlation IDs exist; credentials excluded | Secure extension boundary + tests | Browser messaging boundary still needs validation |
| N01-05 | Hardware profiler | IMPLEMENTED / VALIDATION OPEN | WebGPU/WASM/CPU selection primitive exists | Runtime benchmark + tests | Detection is not benchmark proof |
| N01-06 | Canonical Mesh envelope | IMPLEMENTED / SOURCE-WIRED / SECURITY-CORRECTED | `SoulMeshEnvelope.ts` + `MeshRouter.ts` use the envelope and HybridTransportRegistry; N01 modern HTTP path now verifies body/header HMAC + replay and signs responses | End-to-end transaction | Source wiring exists; live N01↔N02 evidence remains open |
| N01-07 | Authorization | IMPLEMENTED / UNIT-LEVEL VERIFIED | `N01RuntimeGate` + `N01DispatchContract` verify envelope and enforce capability/permission before task admission | Concrete application dispatch wiring | Runtime gate is not yet wired to the separate `SoulMeshMessage` handler path |
| N01-08 | Executable tests | IMPLEMENTED / VALIDATION OPEN | Added `src/core/soul/N01Foundation.test.ts` and `soul:foundation:check` | Successful exact-head CI + application-level integration test | No fresh workflow run is exposed for this branch head yet |
| N01-09 | N01↔N02 transaction | BLOCKED | Target architecture defined | Real correlated capability request/result | Requires verified N01 transport and N02 contract |
| N01-10 | Final N01 audit | BLOCKED | None | Before/after evidence and percentage | Cannot close before runtime proof |

## Confirmed commits in this execution

- `c8b4574f6fc1e0967e9ee8cbf3c59c7e4cfccfc6`: added `SoulMeshEnvelope.ts`.
- `02bb29b3073d60eaafde1f8961a19035c0436d7a`: added focused capability/HMAC/replay test.
- `ecdde2f71931f482e11d5e059e5c1fdd3c84fbc5`: exposed the foundation check command.
- `0c8e75f901abbc350a01f486a9e7c529e7d0de8b` then `c8688355f12a61dfb3aa859ce3f9d955ff87f860`: corrected N01 modern `soul-mesh/1` HMAC/replay enforcement and response signing.
- Earlier control artifacts remain in repository history; they are documentation only and are not counted as functional progress.

## Important correction

The earlier execution board listed stale/mismatched commit SHAs. This file supersedes those references. Only commit SHAs verified from the GitHub write response should be treated as execution evidence.

## Exit criterion for N01

N01 is finished only when: capability discovery is executable; canonical envelope is wired into transport; authentication/integrity is tested; authorization is enforced; provider fallback is executable; browser bridge has a secure boundary; build/typecheck passes; and at least one real N01↔N02 correlated transaction succeeds.

## Next single executable action

Reconcile `N01RuntimeGate` with the concrete `SoulMeshMessage` application dispatch path without creating a second protocol, then run the available N01 build/lint/foundation checks. If validation fails, correct the evidenced failure before advancing.

## Anti-loop rule

After each code change, update this file with the verified commit SHA, validation result, state, blocker (if any), and exactly one next executable action. Never repeat an analysis cycle without changing the evidence state.
