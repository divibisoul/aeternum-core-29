# Soul — Capability E2E and Synergy E2E gate

This document defines executable gates for the real hybrid Soul system. These tests are not simulations and must never be reported as passing without reachable independent runtimes.

## Capability E2E

`npm run test:soul-capabilities:e2e` requires `SOUL_N01_ENDPOINT` through `SOUL_N06_ENDPOINT`. It discovers capabilities through the real `/api/soul-mesh` runtime and verifies only capabilities that have a universal safe execution contract (`mesh.ping` and `mesh.health`) automatically. Domain capabilities are inventoried but are not falsely marked verified until their input/output execution contract is declared.

Every verified operation requires: real HTTP request, target nucleus identity, matching correlationId, HTTP success, and `proof=EXECUTED`.

## Synergy E2E

`npm run test:soul-synergy:e2e` requires all six runtime endpoints. It exercises all 30 directed peer links (`6 × 5`) concurrently and then exercises a six-hop ring across different nuclei. Pilot/Cockpit are not relays in this test. A failure in transport, target identity, correlation, handler proof, or endpoint availability fails the gate.

## No false-positive rule

Topology counts, route declarations, local mocks, capability names, health configuration, and source-code existence are not E2E evidence. `60/60`, `VERIFIED`, or `SYNERGY VERIFIED` may only be reported after runtime evidence is captured.

## Hybrid principle

Nuclei are heterogeneous execution domains. The Mesh contract provides common identity, transport envelope, correlation, validation and proof semantics while allowing each nucleus to keep its own internal implementation. Android/native and WebView can access the same Mesh contract without forcing all execution into one runtime.
