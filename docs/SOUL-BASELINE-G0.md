# SOUL — G0 Baseline

Date: 2026-08-28

This is the initial execution baseline. Values are intentionally marked TBD until measured from repository evidence and executable tests; no percentage is invented.

## System scope

Six nuclei: N01 aeternum-core-29, N02 Eternium-, N03 nexus-aeternum-fusion, N04 nextjs-ai-chatbots, N05 nextjs-ai-chatbot, N06 nextjs-ai-chatbot-2000.

## Baseline dimensions

| Dimension | N01 | N02 | N03 | N04 | N05 | N06 |
|---|---|---|---|---|---|---|
| Implementation | TBD | TBD | TBD | TBD | TBD | TBD |
| Validation | TBD | TBD | TBD | TBD | TBD | TBD |
| Integration | TBD | TBD | TBD | TBD | TBD | TBD |
| Security | TBD | TBD | TBD | TBD | TBD | TBD |
| Architecture adherence | TBD | TBD | TBD | TBD | TBD | TBD |

## Evidence already identified

- N01 contains extensive SOUL contract, capability, topology, communication, transport, and implementation-status documentation.
- N04, N05, and N06 contain independent SoulMesh protocol implementations that must be reconciled rather than blindly duplicated.
- N05 contains recent mesh security/reliability work including HMAC/replay-related changes, peer matrix, gateway, circuit breaker, cache, and integration-test work.
- N02 contains capability/provider infrastructure that should be reused where compatible.

## Important qualification

The existence of endpoints, health checks, ping handlers, interfaces, or documentation does not by itself prove cross-nucleus integration. Functional integration requires an executable capability transaction with correlation and observable result.

## Baseline gate

G0 remains OPEN until the six repositories have been compared at source level and the evidence matrix is populated. No percentage will be claimed as final before that comparison.

## Next step

Complete the global source-level inventory and then open G1 (canonical capability contract), preserving compatible legacy implementations through adapters where necessary.
