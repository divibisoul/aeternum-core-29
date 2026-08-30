# SOUL Parallel Front State

This file is a cross-front coordination snapshot. It is cumulative and must be refreshed from GitHub before changing shared SOUL contracts.

## Verified active front evidence

- N01 (`aeternum-core-29`): cumulative transport/fusion foundation is active on `feature/soul-cumulative-fusion-foundation`, PR #15. Existing `lib/soul-mesh/HybridTransportRegistry.ts` is the real transport registry; canonical transport work is being added through an adapter.
- N03 (`nexus-aeternum-fusion`): latest work binds N02-N03 synergy to runtime capability inventories and preserves dimension-aware multiplicative synergy. Pair-fusion tests and handoff records exist.
- N04 (`nextjs-ai-chatbots`): latest work adds executable runtime bootstrap/capability validation and a composable capability model for adjacent nucleus fusion; validation is wired into CI.
- N05 (`nextjs-ai-chatbot`): latest work adds executable Soul Mesh gateway routing, adaptive transport scoring/fallback, capability composition, ownership/replay protection, and a synchronized N05-N06 fusion handoff.
- N06 (`nextjs-ai-chatbot-2000`): latest work aligns capability contracts with the cumulative fusion model, makes fusion agent-aware, extends fusion analysis to tools, reconciles executable agents/tools with the capability catalog, and records N05-N06 handoff state.
- N02 (`Eternium-`): remains a required source of truth for the N01-N02 and N02-N03 contracts; never infer its current state from historical conversation alone.

## Integration rule

Other fronts may advance independently. N01 must consume their committed contracts and evidence rather than duplicate or overwrite them. When a shared contract differs, preserve compatibility through adapters and reconcile the contract at the Mesh boundary.

## Current simultaneous path

L1: N01×N02 || N03×N04 || N05×N06

L2: (N01×N02)×(N03×N04) || (N03×N04)×(N05×N06)

L3: six-nucleus composition after both four-nucleus paths expose compatible capability graphs.

## Handoff contract

WHAT_CHANGED: record only changes verified in GitHub.

WHAT_WAS_FOUND: record concrete incompatibilities, missing registrations, disconnected capabilities, mocks, or unverified claims.

WHAT_REMAINS: record only actionable work that is not yet evidenced as complete.

WHAT_NEXT_AGENT_SHOULD_DO: provide the next executable integration action, not a general recommendation.

## Anti-duplication rule

Before adding a new registry, protocol, gateway, capability catalog, fusion model, or transport, search all six repositories for an existing implementation. Prefer integration/adaptation over parallel duplication.
