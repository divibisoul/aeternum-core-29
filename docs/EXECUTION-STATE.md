# SOUL — LIVE EXECUTION STATE

Last updated: 2026-08-28

This file is the execution control board. An item cannot remain OPEN without a concrete next action. Every completed item requires repository evidence and validation evidence.

## Current floor: N01

| ID | Stage | Status | Done | Remaining | Why not complete |
|---|---|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Existing N01 structure, Mesh registry, transports, provider/bridge direction inspected | None | Closed |
| N01-02 | Capability Graph | COMPLETE* | CapabilityGraph.ts created with ownership, status, cost, privacy, dependencies and permissions | Runtime exposure + tests | Structure exists; functional proof still required |
| N01-03 | CognitiveProvider contract | COMPLETE* | Provider-neutral local/browser/cloud contract + fallback created | Concrete local provider + tests | Dependency/runtime choice intentionally deferred until mesh contract is stable |
| N01-04 | Browser Session bridge | COMPLETE* | CONNECTED/DEGRADED/DISCONNECTED states and correlation IDs created; password/credential payload excluded | Secure extension boundary + tests | window messaging alone is not sufficient as a trusted extension transport |
| N01-05 | Hardware profiler | COMPLETE* | WebGPU/WASM/CPU selection primitive created | Runtime benchmark + tests | Current implementation is capability detection, not benchmark proof |
| N01-06 | Canonical Mesh envelope | NEXT | Existing transport registry inspected | Envelope, replay protection and HMAC integration | Must reconcile existing N01 transport implementation before replacement |
| N01-07 | Authorization | BLOCKED BY N01-06 | Permission fields exist in capabilities | Enforce permission before dispatch | Requires canonical message/task path |
| N01-08 | Executable tests | OPEN | No final proof recorded | Typecheck + unit/integration tests | Need inspect existing test runner before adding duplicate tooling |
| N01-09 | N01↔N02 transaction | BLOCKED BY N01-06/08 | Target architecture defined | Real correlated capability request/result | N02 contract must be verified before coupling |
| N01-10 | Final N01 audit | BLOCKED | None | Before/after audit and percentage | Cannot close before runtime proof |

\* COMPLETE means the source artifact exists; it does NOT mean the capability is production-validated.

## Exit criterion for N01

N01 is finished only when: capability discovery is executable; a canonical envelope exists; authentication/integrity is tested; authorization is enforced; provider fallback is executable; browser bridge has a secure boundary; build/typecheck passes; and at least one real N01↔N02 correlated transaction succeeds.

## Next concrete action

Implement N01-06 by adapting the existing Mesh transport layer to a canonical envelope, not by deleting/replacing the transport registry. Then validate it before opening N01-07.

## Anti-loop rule

After each code change, update this file with: commit SHA, test result, new state, and the next single executable action. If blocked, record the exact blocker and an alternative; do not repeat the same analysis.
