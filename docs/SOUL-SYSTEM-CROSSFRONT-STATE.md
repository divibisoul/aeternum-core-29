# SOUL — Crossfront State Before Final N07 Fusion

## Current repositories

| Nucleus | Repository | Mesh protocol | Contract | N07 visibility | Current note |
|---|---|---|---|---|---|
| N01 | aeternum-core-29 | soul-mesh/1 | 1.1.0 | typed envelope already knows N07; gateway routing still needs final fusion update | registry/gateway owner |
| N02 | Eternium- | soul-mesh/1 | 1.1.0 | peer list includes N07 | inference/cognitive runtime |
| N03 | nexus-aeternum-fusion | soul-mesh/1 | 1.1.0 | peer list includes N07 | audio/speech runtime |
| N04 | nextjs-ai-chatbots | soul-mesh/1 | 1.1.0 | nucleus union includes N07 | document/tool runtime |
| N05 | nextjs-ai-chatbot | soul-mesh/1 | 1.1.0 | type system includes N07 | conversational runtime |
| N06 | nextjs-ai-chatbot-2000 | soul-mesh/1 | 1.1.0 | peer list includes N07 | pilot/tools/cognitive runtime |
| N07 | Orquestrador- | soul-mesh/1 | 1.2 | final integration deferred | orchestration/correlation/compute layer |

## Critical compatibility finding

Five existing application runtimes use contract `1.1.0`, while N07 currently uses `1.2`. This must be resolved in one controlled fusion change. Do not silently convert one side or maintain multiple incompatible envelopes without an explicit adapter.

## Final N07 input set

N07 must consume normalized representations of: inbound Mesh requests; capability discovery; peer health; registration/identity; authorization result; correlation/trace information; timeout/deadline; capability ownership; payload/schema metadata; tool execution context; inference requests; audio/speech requests; document/tool requests; cognitive/pilot requests; compute requests; execution results; errors; retries; circuit state; resource reservations; and shutdown/drain state.

## Final N07 output set

N07 must be able to emit: capability dispatch; ordered workflow steps; peer delegation; tool invocation; inference delegation; compute selection/execution; cancellation; timeout/deadline propagation; health/status; metrics/trace events; error classifications; retry decisions; circuit transitions; resource release; and final correlated response.

## Fusion invariants

- One canonical envelope after fusion.
- One correlation chain from ingress to egress.
- One owner per executable capability.
- N06 authentication/user ownership remains intact for contextual tools.
- N01 remains the discovery/registry boundary unless the final architecture explicitly changes that ownership.
- N07 orchestrates but does not copy specialized runtimes into itself.
- Existing transports remain truthful; test-only transports are not advertised as production capabilities.
- Final E2E acceptance requires actual traffic, not static endpoint/file checks.

## Final step order

1. Freeze N01–N06 contracts and ownership.
2. Inventory every N01–N06 ingress/egress and capability.
3. Select canonical contract and compatibility adapter rules.
4. Fuse N01 + N06 + N07 boundaries.
5. Connect the remaining nuclei to N07 through the canonical interface.
6. Execute real E2E tests.
7. Observe latency/error/resource metrics.
8. Only then declare the system online.
