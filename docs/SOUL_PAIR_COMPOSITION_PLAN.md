# SOUL Mesh — Ordered Pair Composition

## Purpose

The six nuclei are independent IAs. Mesh integration is performed in ordered pair stages so that every connection is both technically compatible and functionally complementary.

## Ordered stages

| Stage | Pair | Required outcome |
|---|---|---|
| 1 | N01 ↔ N02 | coordination + reasoning/support contract |
| 2 | N03 ↔ N04 | perception + artifact/tool contract |
| 3 | N05 ↔ N06 | inference + planning/validation contract |
| 4 | Stage 1 + Stage 2 | four-nucleus composed workflow |
| 5 | Stage 4 + Stage 3 | six-nucleus cooperative workflow |
| 6 | Full mesh | bidirectional discovery, delegation, response and recovery |

## Rules

1. A later stage must preserve the contracts established by earlier stages.
2. Pair work is simultaneous on both sides: inbound and outbound paths are designed together.
3. A pair is not considered complete from HTTP reachability alone. It requires identity, capability execution, response correlation, failure handling and a real complementary workflow.
4. Existing implementations are reused when they already satisfy the contract; new code must not duplicate an existing canonical implementation.
5. Each stage must produce a measurable artifact that the next stage can consume.
6. Capabilities remain owned by their specialized nucleus; consumers delegate rather than silently reimplement ownership.
7. Correlation and trace context must survive every hop in a composed workflow.
8. Performance work must preserve correctness: bounded concurrency, timeouts, retry/backoff and circuit isolation are preferred over unbounded parallelism.
9. The final six-nucleus workflow must demonstrate that composition produces a capability greater than isolated pair execution.

## Composition target

```text
Stage 1: N01 <-> N02
Stage 2: N03 <-> N04
Stage 3: N05 <-> N06

Stage 4: (N01+N02) <-> (N03+N04)
Stage 5: (N01+N02+N03+N04) <-> (N05+N06)
Stage 6: N01 <-> N02 <-> N03 <-> N04 <-> N05 <-> N06
                         ^                         |
                         +------ result ----------+
```

## Acceptance gate

A stage advances only when its pair can exchange a real capability result, preserve correlation, survive a peer failure without corrupting the request, and expose the resulting capability to the next stage.
