# SOUL — LIVE EXECUTION STATE

Last updated: 2026-08-28

This is the execution control board. An item cannot remain OPEN without a concrete next action. Every completed item requires repository evidence and validation evidence.

## Current floor: N01

| ID | Stage | Status | Done | Remaining | Why not complete |
|---|---|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Existing N01 structure, Mesh registry, transports, provider/bridge direction inspected | None | Closed |
| N01-02 | Capability Graph | IMPLEMENTED / VALIDATION OPEN | CapabilityGraph.ts exists with ownership, status, cost, privacy, dependencies and permissions | Runtime exposure + tests | Source structure exists; no executable proof yet |
| N01-03 | CognitiveProvider contract | IMPLEMENTED / VALIDATION OPEN | Provider-neutral local/browser/cloud contract + fallback exists | Concrete local provider + tests | Dependency choice deferred until transport path is stable |
| N01-04 | Browser Session bridge | IMPLEMENTED / VALIDATION OPEN | Session states and correlation IDs exist; credentials excluded | Secure extension boundary + tests | Browser messaging boundary still needs validation |
| N01-05 | Hardware profiler | IMPLEMENTED / VALIDATION OPEN | WebGPU/WASM/CPU selection primitive exists | Runtime benchmark + tests | Detection is not benchmark proof |
| N01-06 | Canonical Mesh envelope | IMPLEMENTED / VALIDATION OPEN | `src/core/soul/SoulMeshEnvelope.ts` remains preserved as the legacy-compatible envelope; `lib/soul-mesh/SoulMeshEnvelope.ts` is the canonical v1.1.0 contract and `src/core/mesh/TransportRegistry.ts` now bridges the core router to it | Run canonical transport registry unit + repository validation | Live N01↔N02 execution is still not proven |
| N01-07 | Authorization | BLOCKED | Permission fields exist | Enforce permission before task dispatch | Requires canonical verified task path |
| N01-08 | Executable tests | OPEN | CI build/lint workflow exists | Obtain successful run and add focused tests | Repository has no test runner; avoid adding a framework until necessary |
| N01-09 | N01↔N02 transaction | BLOCKED | Target architecture defined | Real correlated capability request/result | Requires verified N01 transport and N02 contract |
| N01-10 | Final N01 audit | BLOCKED | None | Before/after evidence and percentage | Cannot close before runtime proof |

## Confirmed commits in this execution

- `c8b4574f6fc1e0967e9ee8cbf3c59c7e4cfccfc6`: added `SoulMeshEnvelope.ts`.
- Earlier control artifacts remain in repository history; they are documentation only and are not counted as functional progress.

## Important correction

The earlier execution board listed stale/mismatched commit SHAs. This file supersedes those references. Only commit SHAs verified from the GitHub write response should be treated as execution evidence.

## Exit criterion for N01

N01 is finished only when: capability discovery is executable; canonical envelope is wired into transport; authentication/integrity is tested; authorization is enforced; provider fallback is executable; browser bridge has a secure boundary; build/typecheck passes; and at least one real N01↔N02 correlated transaction succeeds.

## Next single executable action

Run the canonical transport registry unit together with the repository build/lint checks. If validation fails, repair the failing boundary before adding another architectural feature.

## Anti-loop rule

After each code change, update this file with the verified commit SHA, validation result, state, blocker (if any), and exactly one next executable action. Never repeat an analysis cycle without changing the evidence state.

## Additive reconciliation — 2026-10-05

The stale N01-06 wiring statement is superseded by the verified branch change: `MeshRouter` now creates and verifies the canonical v1.1.0 envelope through `src/core/mesh/TransportRegistry.ts`, while `HybridTransportRegistry.ts` and the legacy `src/core/soul/SoulMeshEnvelope.ts` remain intact.
Verified code commits on this branch: `8f56f25a447056504b15468f1531a2c08c2ce865` (registry facade), `7911ebe8fe814b4acead244077c167ab684ba8e1` (MeshRouter wiring), `338acad85064ef4ac00f03566fae4f69a0581ccb` (unit coverage), `1b6e1adca2140948de0c3ffbf932359dcfd0317a` (test command), `108900e88b4b7ed70a7e886df8c80c02888d94e1` (CI step).
Runtime evidence remains gated on GitHub CI and live peer availability; no static file presence is counted as live transaction proof.
