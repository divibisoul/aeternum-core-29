# SOUL — LIVE EXECUTION STATE

Last updated: 2026-08-28

This file is the execution control board. An item cannot remain OPEN without a concrete next action. Every completed item requires repository evidence and validation evidence.

## Current floor: N01

| ID | Stage | Status | Done | Remaining | Why not complete |
|---|---|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Existing N01 structure, Mesh registry, transports, provider/bridge direction inspected | None | Closed |
| N01-02 | Capability Graph | COMPLETE* | CapabilityGraph.ts created with ownership, status, cost, privacy, dependencies and permissions | Runtime exposure + tests | Structure exists; functional proof still required |
| N01-03 | CognitiveProvider contract | COMPLETE* | Provider-neutral local/browser/cloud contract + fallback created | Concrete local provider + tests | Dependency/runtime choice intentionally deferred until mesh contract is stable |
| N01-04 | Browser Session bridge | COMPLETE* | CONNECTED/DEGRADED/DISCONNECTED states and correlation IDs created; credential payload excluded | Secure extension boundary + tests | window messaging alone is not sufficient as a trusted extension transport |
| N01-05 | Hardware profiler | COMPLETE* | WebGPU/WASM/CPU selection primitive created | Runtime benchmark + tests | Current implementation is capability detection, not benchmark proof |
| N01-06 | Canonical Mesh envelope | IMPLEMENTED / VALIDATION OPEN | Added canonical v1.0 envelope with message types, node IDs, correlationId, timestamp, nonce, TTL and HMAC-SHA256 verification with replay-set support | Adapt transport registry + run CI validation | Envelope now exists, but transport dispatch still uses the pre-existing registry and CI result is not yet recorded |
| N01-07 | Authorization | BLOCKED BY N01-06 VALIDATION | Permission fields exist in capabilities | Enforce permission before dispatch | Must attach authorization to the verified task path |
| N01-08 | Executable tests | IN PROGRESS | Added GitHub Actions build/lint workflow | Obtain successful run; add focused envelope tests without new test framework if possible | Repository had build/lint scripts but no test runner |
| N01-09 | N01↔N02 transaction | BLOCKED BY N01-06/08 | Target architecture defined | Real correlated capability request/result | Requires validated envelope and N02 contract |
| N01-10 | Final N01 audit | BLOCKED | None | Before/after audit and percentage | Cannot close before runtime proof |

\* COMPLETE means the source artifact exists; it does NOT mean the capability is production-validated.

## Evidence from current commits

- `c7d1338e5e9ff26cb28b0f41447ea7c93532771b`: canonical SoulMeshEnvelope implementation.
- `eb859bc10f7431cc84b3b0a0ec4404e15b2262c0`: N01 CI build/lint validation workflow.
- `e5a3fb83f22c80a855ce5597e028f369c9ad0d51`: live execution state board created.

## Exit criterion for N01

N01 is finished only when: capability discovery is executable; a canonical envelope exists; authentication/integrity is tested; authorization is enforced; provider fallback is executable; browser bridge has a secure boundary; build/typecheck passes; and at least one real N01↔N02 correlated transaction succeeds.

## Next concrete action

Validate the new envelope/CI result. If CI passes, adapt the existing `lib/soul-mesh/HybridTransportRegistry.ts` around the canonical envelope without deleting the registry. If CI fails, fix the failing code before adding another feature.

## Anti-loop rule

After each code change, update this file with: commit SHA, test result, new state, and the next single executable action. If blocked, record the exact blocker and an alternative; do not repeat the same analysis.
