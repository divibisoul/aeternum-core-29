# SOUL — Unified Engineering Coordination Contract

## Purpose
This repository is one independent AI nucleus (N01) of the SOUL federation. The nuclei remain independent, but cooperate through the single Soul Mesh.

## Governing engineering directive
1. GitHub is the source of truth for implemented state.
2. **Whenever an audit finds an incomplete, inactive, broken, inconsistent, unreachable, untested, stale, or non-functional area, correct it immediately before declaring that area complete.**
3. Preserve working code; recover and adapt before replacing. Never delete functionality merely to simplify.
4. Audit before changing and re-audit after changing. Every claimed correction must be checked against the real repository state.
5. Never claim work was completed merely because an edit was issued. Verify the resulting file/tree/commit and verify the relevant behavior with the strongest available evidence.
6. A missing runtime test is not permission to stop structural implementation. Continue with static, contract, schema, compatibility, automated, and integration validation, while marking uncommissioned behavior honestly.
7. **Never stop solely because of an error or severe failure.** Treat every failure as a defect signal, investigate the root cause, research viable solutions, and continue through an alternative path when the original path is blocked.
8. **Internet/web research is an engineering fallback and evidence channel.** When a technical limitation, dependency problem, API mismatch, build failure, or architectural uncertainty appears, research authoritative documentation, compatible implementations, standards, and alternative approaches before giving up. Select the least disruptive robust solution.
9. Authentication and authorization remain separate. Mesh authorization is capability-based.
10. Mesh envelopes use the common identity/correlation/timestamp/nonce/HMAC contract where supported by the current implementation.
11. Do not create a second Mesh. Integrate with the existing Soul Mesh.
12. Every nucleus is an AI with its own agents, capabilities, tools, input, output, discovery, delegation and response mechanisms.
13. **Functions and tools are first-class fusion assets.** When nuclei are connected, inspect the native functions, agents, providers, tools, capability registries and execution paths; fuse by ownership-aware delegation, adapters and composition. Do not merely connect message transport.
14. Do not duplicate existing modules. Extend or adapt compatible implementations.
15. When a solution requires touching multiple fronts, sequence the work to avoid incompatible concurrent mutations, but do not pause an independent front unnecessarily.

## Evidence ladder
Use the strongest available evidence in this order: live runtime/E2E result; automated integration test; package/unit/race/build validation; contract/schema compatibility validation; static source inspection. A weaker level never upgrades a stronger claim without evidence.

## Time and delivery discipline
1. Record the start time of every substantial engineering front.
2. During long-running work, reassess progress and blockers rather than assuming the task is advancing.
3. Before delivery, verify the current repository HEAD, latest relevant CI/check status, changed files, and unresolved blockers.
4. **Delivery is allowed only after a final re-audit confirms that the reported state matches the actual state.**
5. Do not trade correctness for speed. Use parallel work where safe, but never skip verification because time has elapsed.

## Connection program
N07 is the final fusion/commissioning nucleus. Before N07 is closed, stabilize the preceding connection fronts and their shared contracts.

Current sequence:
N06↔N05 → N05↔N04 → N04↔N03 → N03↔N02 → N02↔N01 → **N01↔N06↔N07 final fusion**.

The final N07 phase must receive the stabilized ingress/egress, discovery, delegation, authorization, response-correlation, recovery, functions, agents and tools exposed by the preceding fronts. N07 remains an independent AI runtime while acting as the final orchestration/fusion layer; it must not become a replacement for N01 or N06.

Engineering sequence is a dependency order, not a runtime restriction. Runtime communication remains Mesh-routed and may use any authorized nucleus when required.

## Parallel work
Independent connection fronts may be worked simultaneously when they do not mutate the same incompatible resource. The shared nucleus must remain contract-compatible with both sides. Findings from one front must be consumable by the next through GitHub handoff artifacts/records.

## Handoff minimum
Each completed work unit must record: source, target, connection, commit, changed files, discovered problems, corrections, capabilities/agents/tools affected, dependencies, elapsed engineering time, verification evidence, remaining work, compatibility status, next consumer, and commissioning status.

## Completion definition
A nucleus/connection is not considered complete merely because files exist, compile, or a ping succeeds. Structural completion requires compatible AI responsibilities, agents, tools, capabilities, Mesh ingress/egress, discovery, delegation, authorization, correlation, failure handling and integration with adjacent nuclei. Runtime commissioning is tracked separately.

## Optimization objective
The goal of connected nuclei is multiplicative capability: agents, functions and tools should complement and extend one another rather than merely exchange messages. When nuclei share a connection, optimize the chain for reuse, parallelism, low latency, least privilege, resilience, observability, graceful fallback and minimal duplication.

## Final delivery rule
Before presenting a task as complete, report the actual state, not the intended state. Include a compact health/coverage graph for the relevant fronts, current CI/runtime evidence, elapsed time, and any remaining unverified areas. A graph is a decision aid for delivery readiness, not a substitute for tests.

## CUMULATIVE MASTER DIRECTIVE

No previous directive is cancelled. Apply the full sequence PRESERVE → AUDIT → MAP → CORRECT → COMPLETE → CONNECT → CROSS → FUSE → OPTIMIZE → VALIDATE → DOCUMENT → RE-AUDIT. Every actionable finding becomes engineering work. Research official documentation, standards and viable alternatives when blocked; a failed first approach is not a stopping condition.

Audit the complete six-nucleus surface: identity, agents, capabilities, functions, tools, providers, context, memory, execution, inputs, outputs, Mesh, discovery, delegation, response, security, resilience, dependencies, performance, tests and CI. Six core nuclei imply 15 bidirectional peer pairs and 30 directed logical links, with five IN and five OUT peer relationships per nucleus.

Soul Mesh remains the single interoperability layer. Its functional chain is DISCOVERY → CAPABILITY DISCOVERY → TASK ROUTING → DELEGATION → EXECUTION → RESPONSE → CORRELATION → COMPOSITION. Transport resolution may use HTTP/REST, WebSocket/realtime, events/PubSub, loopback or internal adapters when justified, without creating a second Mesh.

For every pair investigate agents×agents, tools×tools, capabilities×capabilities, context×context, execution×execution and AI×AI. Only technically grounded, useful compositions become emergent capabilities. Each new capability requires contract, owner, participants, input, processing, output, dependencies, execution mode, registry, tests and documentation.

Enable dynamic agent federation, capability-based delegation, routing by capability fit/load/latency/availability/priority/cost/dependencies/reliability, safe parallel execution, cache reuse and resilient recovery. Treat N01's gateway/registry/device capabilities as executable resources, not merely metadata.

SOUL Super GPU / SuperCompute is a logical distributed processing fabric: TASK → DECOMPOSITION → SCHEDULER → CAPABILITY ROUTER → PARALLEL EXECUTION → RESULT AGGREGATION → VALIDATION → FINAL RESULT. Combine inter-nucleus and intra-nucleus parallelism when dependencies permit. N01 contributes its registry/gateway/device and cognitive resources to this fabric.

Coverage/health/execution/latency graphs are mandatory delivery aids where measurable, but never substitutes for tests. Final reports must use the actual current HEAD and latest CI state. N07 remains the final implementation target; do not use N07 files as proof that N01–N06 are ready.
