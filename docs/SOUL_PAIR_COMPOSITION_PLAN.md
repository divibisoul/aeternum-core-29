# SOUL Mesh — Ordered Pair Composition

## Purpose
The six nuclei are independent IAs. Mesh integration is performed in ordered pair stages so every connection is technically compatible, functionally complementary and capable of producing a higher-order composition.

## Ordered stages

| Stage | Pair / fusion | Required outcome |
|---|---|---|
| 1 | N01 ↔ N02 | coordination + reasoning/support contract |
| 2 | N03 ↔ N04 | perception + artifact/tool contract |
| 3 | N05 ↔ N06 | inference + planning/validation contract |
| 4 | (N01+N02) ↔ (N03+N04) | four-nucleus composed workflow |
| 5 | (N01+N02+N03+N04) ↔ (N05+N06) | six-nucleus cooperative workflow |
| 6 | Full mesh | bidirectional discovery, delegation, response, recovery and higher-order composition |

## Rules

1. A later stage must preserve the contracts established by earlier stages.
2. Pair work is simultaneous on both sides: inbound and outbound paths are designed together.
3. Where dependencies permit, the three initial pair stages are developed simultaneously; completion of one pair must not unnecessarily block independent pair work.
4. A pair is not complete from HTTP reachability alone. It requires identity, capability execution, response correlation, failure handling and a real complementary workflow.
5. Existing implementations are reused when they already satisfy the contract; new code must not duplicate an existing canonical implementation.
6. Each stage must produce a measurable artifact that the next stage can consume.
7. Capabilities remain owned by their specialized nucleus; consumers delegate rather than silently reimplement ownership.
8. Correlation and trace context must survive every hop in a composed workflow.
9. Performance work must preserve correctness: bounded concurrency, timeouts, retry/backoff and circuit isolation are preferred over unbounded parallelism.
10. Each fusion must explicitly inspect the agents, tools, capabilities, context and runtime of every participating nucleus before inventing new functionality.
11. A fusion is successful only when the combination exposes at least one executable workflow that requires contributions from both sides; merely colocating capabilities is not fusion.
12. The final six-nucleus workflow must demonstrate that composition produces a capability greater than isolated pair execution.

## Simultaneous execution model

The engineering fronts operate concurrently:

```text
PAIR A                 PAIR B                 PAIR C
N01 <-> N02            N03 <-> N04            N05 <-> N06
   │                       │                       │
   └── pair artifact ──────┴────── pair artifact ─┘
                 ↓ shared handoff contracts

FUSION 1: (N01+N02) <-> (N03+N04)
                    ↓
FUSION 2: (N01+N02+N03+N04) <-> (N05+N06)
                    ↓
FULL SOUL MESH: N01 <-> N02 <-> N03 <-> N04 <-> N05 <-> N06
```

## Multiplicative synergy model

For each connection/fusion calculate a composition index rather than treating the pair as a simple sum:

`C(A,B) = E_A × E_B × X × G × T × D × R`

Where:
- `E_A` = verified executable capability breadth of A;
- `E_B` = verified executable capability breadth of B;
- `X` = context/schema compatibility;
- `G` = agent complementarity;
- `T` = tool complementarity;
- `D` = delegation interoperability;
- `R` = observed reliability of the request/result path.

The index is a relative engineering measure, not a claim that software intelligence literally multiplies. Its purpose is to force deeper analysis of the cross-product of capabilities instead of counting endpoints.

For four-nucleus fusion, evaluate the two completed pair compositions as components and then evaluate cross-pair workflows. Do not assume `pair A + pair B` is automatically a fusion. The fusion must create a new executable chain.

## Higher-order capability rule

Every fusion stage must search for new capabilities created by crossing:

`agent × agent`
`tool × tool`
`agent × tool`
`capability × capability`
`context × capability`
`delegation × capability`

Examples:
- intent analysis + generation → intent-aware generation;
- perception + artifact production → evidence-backed artifact creation;
- inference + planning/validation → reasoned execution plan;
- four-nucleus context + inference → multi-domain cooperative reasoning;
- full mesh delegation + all specialized owners → dynamic task decomposition.

These are candidate emergent workflows and must be implemented and verified rather than assumed to exist.

## Acceptance gate
A stage advances only when its pair/fusion can exchange a real capability result, preserve correlation, survive a peer failure without corrupting the request, expose the resulting capability to the next stage and document the cross-product of participating agents/tools/capabilities.

## Verification states
`UNVERIFIED` = topology/contract exists only.
`NEGOTIATING` = transport selection attempted.
`CONNECTED` = request traversed transport and target accepted it.
`EXECUTED` = target handler actually ran.
`VERIFIED` = correlated response returned and expected capability effect was observed.
`FUSED` = multi-step workflow composed capabilities from both sides and produced a higher-order result.
`FAILED` = an observed failure; never coerce to success.

Only VERIFIED/FUSED count as functional AI-to-AI connectivity.
