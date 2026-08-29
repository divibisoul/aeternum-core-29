# SOUL N01 ↔ N02 — Synergy Fusion Contract

## Status
ADDITIVE. This contract deepens the existing N01↔N02 link without replacing the canonical Mesh protocol, router, agents or capabilities.

## Ground truth used for this revision
N01 currently exposes owned Mesh/cognitive/native capabilities including `cognitive.intent`, `agi.process`, `ai.reasoning`, and Android runtime capabilities. The repository also contains an N01 agent registry and explicit N01↔N02 hybrid link. N02 currently exposes a real provider bridge through `ai.generate`, `ai.multimodal` and `cognitive-processing`, and its Mesh endpoint routes executable capabilities through the N02 capability runtime and agent registry.

## Composition principle
The pair is treated as two independent IAs. Neither IA absorbs the other. N01 contributes orchestration, intent, provider-neutral reasoning, Android/runtime context and Mesh transport. N02 contributes provider-backed generation, multimodal processing and cognitive processing. The combination is a cooperative pipeline rather than a copied implementation.

## Capability cross-product

| N01 contribution | N02 contribution | Emergent pair capability |
|---|---|---|
| `cognitive.intent` | `ai.generate` | intent-aware response planning |
| `ai.reasoning` | `ai.generate` | context-grounded reasoning + generation |
| `agi.process` | `cognitive-processing` | AGI processing with provider-backed cognitive execution |
| `android.device_info` / `android.network` | `cognitive-processing` | runtime-aware cognitive analysis |
| `android.memory` | `ai.generate` | resource-aware generation decisions |
| Mesh discovery/health | all N02 executable capabilities | capability-aware delegation and routing |

These are composition targets, not runtime proof. A target becomes VERIFIED only after real execution.

## Bidirectional flows

### N01 → N02
1. N01 identifies intent or task.
2. N01 selects an N02-owned capability from current discovery metadata.
3. N01 sends the canonical Mesh request with source, target, capability, correlationId and contract version.
4. N02 resolves the request through its real capability runtime and registered agent.
5. N02 returns a structured result preserving correlation.
6. N01 may feed the result into its own AGI/cognitive pipeline.

### N02 → N01
1. N02 identifies a need for an N01-owned capability.
2. N02 requests the authoritative N01 capability rather than duplicating it.
3. N01 resolves the request through its real agent/runtime owner.
4. N01 returns the structured result with correlation preserved.
5. N02 may consume the result as context for its provider-backed processing.

## Higher-order combinations
The pair must be evaluated not only as A→B but as composition graphs:

`N01.intent → N02.generate → N01.reasoning`

`N01.runtime-context → N02.cognitive-processing → N01.agi.process`

`N02.generate → N01.reasoning → N02.cognitive-processing`

The third pattern is deliberately a feedback loop: one IA produces an intermediate artifact, the other evaluates/transforms it, and the first can continue processing it. This is the seed for later four-nucleus fusion.

## State model
`DISCOVERABLE → NEGOTIATED → EXECUTABLE → VERIFIED → FUSED`

- DISCOVERABLE: metadata can identify the peer/capability.
- NEGOTIATED: protocol and required schemas agree.
- EXECUTABLE: a real handler is reachable through the destination runtime.
- VERIFIED: a real bidirectional capability transaction returns a correlated result.
- FUSED: a multi-step workflow demonstrably combines N01 and N02 capabilities.

Ping, health and HTTP success are diagnostic only and cannot advance the pair beyond DISCOVERABLE/NEGOTIATED.

## Fusion invariant
At every future fusion stage calculate the capability cross-product before adding new code:

`pair_value = executable_A × executable_B × context_compatibility × agent_complementarity × tool_complementarity × delegation_reliability`

The product is an architectural comparison index, not a claim of mathematical AGI capability or benchmark performance. A fusion is valuable only when it creates at least one new executable workflow that neither side could provide alone.

## Preservation invariant
No existing N01 or N02 implementation is removed by this contract. Existing local execution remains valid. Remote execution is additive. Existing names remain valid during migration.

## Next-stage artifact
The output of N01↔N02 is a reusable pair contract that later fusion stages can consume: identity + capability ownership + executable handlers + explicit context + correlated request/result + bidirectional delegation + composition graph. Later pairs must attach to this contract rather than inventing another Mesh dialect.
