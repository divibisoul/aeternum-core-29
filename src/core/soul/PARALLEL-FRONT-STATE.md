# SOUL Parallel Front State

This is the cumulative cross-front coordination ledger. GitHub state is authoritative. Refresh this ledger before changing shared SOUL contracts.

## Latest verified front activity

- N01 `aeternum-core-29`: current cumulative fusion/transport work is on `feature/soul-cumulative-fusion-foundation`; PR #15 is active. N01 already contains a canonical transport adapter, capability graph, Mesh envelope, router, runtime gate, self-tests, provider scheduler, hardware profiler, integrity/authorization contracts, and fusion sequence artifacts.
- N02 `Eternium-`: remains the authoritative peer for the N01↔N02 protocol/capability contract. Its state must be read from GitHub before N01 changes the shared contract.
- N03 `nexus-aeternum-fusion`: current commits bind N02↔N03 synergy to runtime capability inventories, preserve dimension-aware multiplicative synergy, add pair-fusion tests, and maintain handoff artifacts.
- N04 `nextjs-ai-chatbots`: current commits provide a 15-capability execution surface, runtime bootstrap validation, CI validation, composable capability fusion, and cumulative/failure-antibody coordination artifacts.
- N05 `nextjs-ai-chatbot`: current commits provide an executable Soul Mesh gateway, runtime routing through that gateway, adaptive transport scoring/fallback, capability composition, ownership/replay protection, and N05↔N06 handoff state. The latest commit also records actual CI failure evidence; therefore CI success must not be inferred from the existence of the validation code.
- N06 `nextjs-ai-chatbot-2000`: current commits align the capability contract with cumulative fusion, make capability fusion agent-aware, extend fusion analysis to tools, reconcile the executable agent/tool registry with the capability catalog, and persist N05↔N06 handoff state.

## Simultaneous topology

L1 — execute/analyze concurrently:

N01×N02 || N03×N04 || N05×N06

L2 — execute/analyze concurrently:

(N01×N02)×(N03×N04) || (N03×N04)×(N05×N06)

L3 — six-nucleus composition only after the compatible capability graphs from the two four-nucleus paths are available.

The sequence is functional, not arbitrary. Never replace it with random pair selection merely for convenience.

## Cross-front operating rule

Each front may advance independently, but every front must consume committed evidence from the other fronts. A claim from another conversation is not evidence until represented by GitHub code, tests, commits, PRs, or an explicit handoff artifact.

Prefer integration and adapters over duplicate registries, protocols, gateways, capability catalogs, fusion engines, or transports.

## Failure-antibody rule

DETECT → LOCATE ROOT CAUSE → PRESERVE WORKING BEHAVIOR → CORRECT → COMPLETE → INTEGRATE → TEST → RECORD → CONTINUE.

A detected defect is an executable work item, not merely a report. If a direct fix is unsafe, isolate it behind a compatibility adapter and continue with independently actionable work.

## Handoff contract

WHAT_CHANGED: only GitHub-verified changes.

WHAT_WAS_FOUND: concrete incompatibilities, missing registrations, disconnected capabilities, mocks, stale contracts, failing validation, or unverified claims.

WHAT_REMAINS: actionable work not yet evidenced as complete.

WHAT_NEXT_AGENT_SHOULD_DO: the next executable integration action.

## Current status

N01: IN PROGRESS
N01×N02: IN PROGRESS / contract reconciliation required before declaring closed
N03×N04: ACTIVE on peer fronts
N05×N06: ACTIVE on peer fronts
Four-nucleus fusion: PREPARATION / dependent on compatible pair contracts
Six-nucleus fusion: PENDING compatible four-nucleus capability graphs

## Mandatory observation

Before every material N01 change, inspect recent commits/branches/PRs across all six repositories. Reuse useful work from the other five fronts. Do not wait for a front to finish if an independent correction can be made safely now.
