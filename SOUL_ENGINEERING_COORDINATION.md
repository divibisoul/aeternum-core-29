# SOUL — Unified Engineering Coordination Contract

## Purpose
This repository is one independent AI nucleus (N01) of the six-nucleus SOUL. The six nuclei remain independent, but cooperate through the single Soul Mesh.

## Unified execution rules
1. GitHub is the source of truth for implemented state.
2. Preserve working code; recover and adapt before replacing. Never delete functionality merely to simplify.
3. Audit before changing. Re-audit after changing.
4. A missing runtime test is not permission to stop structural implementation. Mark uncommissioned behavior honestly and continue with static, contract, schema, and compatibility validation.
5. Never create a second Mesh. Integrate with the existing Soul Mesh.
6. Every nucleus is an AI with its own agents, capabilities, tools, input, output, discovery, delegation and response mechanisms.
7. Authentication and authorization remain separate. Mesh authorization is capability-based.
8. Mesh envelopes use the common identity/correlation/timestamp/nonce/HMAC contract where supported by the current implementation.
9. Do not duplicate existing modules. Extend or adapt compatible implementations.
10. Research viable alternatives when a technical limitation is found; select the least disruptive robust solution.

## Sequential connection program
Engineering closes adjacent pairs in this order:
N06↔N05 → N05↔N04 → N04↔N03 → N03↔N02 → N02↔N01.

Runtime communication remains Mesh-routed and may use any authorized nucleus when required. The sequence is an engineering dependency order, not a runtime restriction.

## Parallel work
Two adjacent connection fronts may be worked simultaneously when they do not mutate the same incompatible resource. The shared nucleus must remain contract-compatible with both sides. Findings from one front must be consumable by the next through GitHub handoff artifacts/records.

## Handoff minimum
Each completed work unit must record: source, target, connection, commit, changed files, discovered problems, corrections, capabilities/agents/tools affected, dependencies, remaining work, compatibility status, next consumer, and commissioning status.

## Completion definition
A nucleus/connection is not considered complete merely because files exist or compile. Structural completion requires compatible AI responsibilities, agents, tools, capabilities, Mesh ingress/egress, discovery, delegation, correlation, authorization, failure handling and integration with adjacent nuclei. Runtime commissioning is tracked separately.

## Optimization objective
The goal of connected pairs is multiplicative capability: the agents and tools of one nucleus should complement and extend the other rather than merely exchange messages. When two adjacent pairs share a nucleus, optimize the three-nucleus chain for reuse, parallelism, low latency, least privilege, resilience and minimal duplication.
