# SOUL Cross-Front State — Live Reconciliation

GitHub is the source of truth. This file is a durable handoff between the six parallel engineering fronts and must be refreshed from live repository state before architectural decisions.

## Live main-branch commits observed 2026-09-01

| Nucleus | Repository | Main HEAD observed | Latest confirmed work |
|---|---|---|---|
| N01 | `divibisoul/aeternum-core-29` | `3c1e2bb975cc04c17f06e20726336b3777912341` | Super GPU dependency normalization + timing telemetry; staged N07 boundary; Mesh transport hardening |
| N02 | `divibisoul/Eternium-` | `02a1dbdefed62e49341767c605c6fa706ae8b32a` | Canonical HMAC signing for peer egress |
| N03 | `divibisoul/nexus-aeternum-fusion` | `01db86c7a74dbbd89b1f353115e04110aeb0a197` | Peer HMAC nonce generation repaired after canonicalization |
| N04 | `divibisoul/nextjs-ai-chatbots` | `d42484df548f2a960aa502880ac1d49e35f3dae8` | Cross-front matrix reconciled with current tree |
| N05 | `divibisoul/nextjs-ai-chatbot` | `749f089f67e084359e25c982891233213f859635` | Peer discovery requires explicit executable capability evidence |
| N06 | `divibisoul/nextjs-ai-chatbot-2000` | `f35f9e9e2bfd942fdfa35bc0d8e7af302f8d4e03` | N07 staged as structural-only; active N06 peer execution remains N01–N05 |

## Confirmed engineering corrections in this pass

- N05 discovery no longer treats generic/declared capability inventories as invocation permission; only `executableCapabilities` can satisfy capability resolution.
- N01 SuperCompute and legacy SuperGPU dependency handling now accept the canonical `dependsOn` form and legacy `dependencies` form consistently.
- N01 SuperGPU results expose per-task duration telemetry for performance measurement.
- N01 TypeScript peer transport now has bounded retry/backoff and a per-peer circuit breaker; this transport is distinct from the active Node gateway runtime and must not be conflated with it.
- N01/N06 no longer allow active N07 execution before final commissioning; N07 remains structurally represented for the final fusion boundary.
- N06 discovery explicitly reports active peers separately from structural peers.
- N03 has independently repaired its canonical HMAC nonce generation on the live `main`, so the cross-front security state has changed since the earlier snapshot.

## Important runtime distinction

The N01 repository contains both the Node `scripts/soul-mesh-server*.mjs` gateway path used by `npm run mesh:n01` and a TypeScript `src/core/mesh` runtime. They must not be treated as one implementation. The active server entrypoint currently spawns `scripts/soul-mesh-server.mjs`; the TypeScript peer client is a separate transport/runtime surface and must be validated independently before its behavior is called active in production.

## N07 commissioning rule

N07 remains the final integration stage. Do not create premature active execution dependencies on N07. Before commissioning N07, reconcile all N1–N6 input/output channels, capabilities, tools, agents, transport contracts, observability and routing paths. N07 is then fused with N01 and N06, including function/tool composition and validated emergent capabilities.

## Pair / fusion work

The original adjacent-pair wave remains valid as a coordination map:
`N06×N05 → N05×N04 → N04×N03 → N03×N02 → N02×N01`

Pair work must cross-check agents, tools, capabilities, context and execution. The wave is not a restriction: compatible four-nucleus and six-nucleus analysis may proceed in parallel whenever it does not overwrite another front.

## Mandatory handoff fields

Every front should record:
`WHAT_CHANGED`, `WHAT_WAS_FOUND`, `WHAT_REMAINS`, `NEXT_AGENT`, affected nuclei, affected agents/tools/capabilities, compatibility assumptions, commit, branch, dependencies, tests/CI evidence, performance evidence, and real blockers.

## Validation rule

Do not infer runtime success from declarations or documentation. A capability is execution-ready only when its handler/dispatcher, contract, routing path and validation evidence exist. CI/test status must be checked from the live repository/commit before marking work green.
