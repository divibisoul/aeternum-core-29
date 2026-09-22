# SOUL — LIVE EXECUTION STATE

Last updated: 2026-09-22

This is the N01 continuous execution control board. Every state transition requires repository evidence and validation evidence. A new prompt continues this state; it does not create a new project or parallel implementation.

## Current floor: N01

| ID | Stage | Status | Evidence / current state |
|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Main `6c828648fb2d953f609218d612501102566684fc` and PR #25 lineage audited. |
| N01-02 | Canonical transport | IMPLEMENTED / VALIDATION OPEN | `CanonicalTransportAdapter` is the only transport-selection authority and delegates to `HybridTransportRegistry`. |
| N01-03 | Capability authority | IMPLEMENTED / VALIDATION OPEN | `N01CapabilityBridge` + self-test adapt the existing `CapabilityGraph`; no second registry created. |
| N01-04 | Fast-inference routing | IMPLEMENTED / VALIDATION OPEN | Existing neural/prefrontal routing carries `fast_inference` priority without moving provider ownership into N01. |
| N01-05 | Soul Sentinel | IMPLEMENTED / VALIDATION OPEN | Watchdog, integrity snapshot, metrics, bounded restart and boot/package-replacement startup are implemented. Android runtime proof remains pending. |
| N01-06 | Seven-nucleus topology | CORRECTED / VALIDATION OPEN | 7 nuclei × 6 peers = 42 directed links and 21 bidirectional pairs. |
| N01-07 | Environment/security | PRESENT | Secrets remain template-only; no real secret values added. |
| N01-08 | Source review | CORRECTED / VALIDATION OPEN | 44 current PR paths reviewed; concrete envelope, router, Android JVM, capability-name, protocol-duplication and diagnostic robustness defects corrected on the same branch. |
| N01-09 | Regression validation | BLOCKED BY EXECUTION ENVIRONMENT | Full local commands cannot be run in this agent environment; GitHub Actions also previously failed before steps with runner-unassigned evidence. |
| N01-10 | N01↔N02 runtime transaction | OPEN | Requires actual deployed peer endpoints and a real correlated request/response. |
| N01-11 | Final N01 certification | BLOCKED | No PASS/HEALTHY/ONLINE/merged claim is permitted without executable evidence. |

## Source-review corrections recorded in this continuation

- `bcf365e931b802debeb156de5c0f2a7c47cdd828` — canonical envelope compatibility facade.
- `638e8d0fe5787fe5ae6357760fc0ac2be07abf22` — MeshRouter canonical task creation.
- `8d1d18373e50467499c4e8b2241bad4de0db2920` — canonical transport integration test async assertion fix.
- `a12a62af03811d149cba6e5c65e400b5c212f629` — package scripts with dependency baseline restored.
- `5784ecdad14d7663d7f83943966cc4e9bf3861bc` — Android capability names aligned with gateway.
- `d0e9de540dc74c39aeaa68da1a15f3826167af89` — Android Java 17/Kotlin 17 restoration.
- `39231d686dba9f4d82ff80f734991121373882c1` — canonical protocol constants in N01 contract.
- `cc1678630318724b41bba74b3803c560caa169b4` — cancellable/safe Mesh diagnostics.
- `87d4cfd1dc9d6a1ac8e757b2cda456a620a5c268` — deterministic, correlation-safe runtime fusion probe.
- `acb2b31f061b7fa9068f8947830760de5956a96a` — N01 architecture specification.
- `a8f22aa8884a3dd3fccebc0216eafc19c4102d40` — N01 changelog.
- `426a0a842a4dcb4024890f9ba98836612b0bea77` — complete review report with current 43-file inventory.
- `6a34a56c6fd47594cdb429b0e83750f061222734` — README validation/documentation closure.

## Canonical PR

PR #25 remains the only N01 consolidation PR. Its current verified head is updated by the latest commit after this source correction, base remains `main` at `6c828648fb2d953f609218d612501102566684fc`, state `open`, not merged.

## Anti-loop rule

Before every subsequent N01 action, re-read this file, compare `consolidacao-n01` against `main`, inspect the latest GitHub execution evidence, and continue from the latest verified SHA. Never restart analysis from an old prompt, never create a third solution for an existing responsibility, and never claim PASS/ONLINE without execution evidence.

## Single next executable action

Run the real N01 validation gates against the current HEAD, then re-audit the generated execution evidence. Because this agent cannot execute the private checkout locally and the hosted Actions path previously failed before runner assignment, no local PASS is claimed here. Once an executor is available, any source-level failure returns to this same PR #25 for correction before merge and before N02.


## Continuous audit additions — 2026-09-22

- SARA federation adapter was added to the N01 canonical branch without replacing Mesh ownership.
- SARA capability routing now uses the same correlation ID and explicit server-side service configuration.
- Envelope facade clock-skew validation was reconciled to the canonical 30-second contract.
- Global SOUL+SARA forensic audit continues in parallel; no N01 gate is bypassed by that work.
