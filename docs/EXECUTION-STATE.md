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
| N01-06 | Canonical Mesh envelope | IMPLEMENTED / VALIDATION OPEN | `src/core/soul/SoulMeshEnvelope.ts` added with v1.0 envelope, N01–N06/BROADCAST IDs, message types, timestamp, nonce, TTL, correlationId and HMAC-SHA256 verification | Adapt transport registry + execute validation | The new envelope is not yet wired into the existing transport registry |
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

Adapt the existing `HybridTransportRegistry` to accept/emit the canonical envelope without deleting the registry, then run the repository's available build/lint validation. If validation fails, fix the failure before adding another architectural feature.

## Anti-loop rule

After each code change, update this file with the verified commit SHA, validation result, state, blocker (if any), and exactly one next executable action. Never repeat an analysis cycle without changing the evidence state.


---

## Branch overlay — 2026-09-22 — Soul Admin Plus forensic recovery

This section is additive to the historical execution board above; it does not invalidate prior records.

- Branch audited: `feat/soul-admin-android-plus-final`
- Base relation at audit: `main` 480ad4d8ed8814e4aa2c3d69043390d90658e52c; branch 86 commits ahead, 0 behind.
- Current front: Soul Admin Plus implementation exists; runtime validation remains OPEN.
- Corrected in the latest recovery pass: N07 transport contract/correlation, token clearing, queue priority/failure evidence, shared cockpit runtime, concurrent auth state, shell command validation, NPU evidence semantics, dashboard update serialization, log retention, watchdog ANR/snapshot/load reduction, legacy P-256 key preservation.
- CI remains BLOCKED/UNMEASURABLE: recent reruns finish in failure with empty steps and BlobNotFound logs.
- Android field commissioning remains OPEN: no verified APK installation/execution evidence in this environment.
- OctaCore remains BLOCKED until the authoritative eight-component processor specification is recovered.
- Next executable gate: restore observable CI, then build/test and live device/backend commissioning.
