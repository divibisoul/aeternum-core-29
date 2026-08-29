# SOUL — UNIFIED EXECUTION DIRECTIVE

## Authority and reality
GitHub is the only authoritative implementation state. Parallel ChatGPT conversations are independent engineering fronts. Never infer implementation from chat history alone. Before changing any nucleus or pair, inspect current GitHub state, existing files, recent commits and affected interfaces. A feature is structurally present only when GitHub contains it; it is runtime-proven only when it has actually executed.

## Preservation and additive evolution
This directive is additive. Do not delete, reset, invalidate, replace or unnecessarily rewrite existing work. Preserve existing nuclei, agents, tools, capabilities, transports, contracts and backward-compatible paths. If something already exists, reuse and integrate it. If defective, correct it or add the smallest compatible migration layer. Do not modify unrelated nuclei merely for convenience.

## Six independent AI nuclei
N01–N06 are independent IAs. Each owns its agents, tools, capabilities, runtime and specialization. Soul Mesh is the cooperative layer through which they discover, request, execute, respond and delegate work. The goal is six specialized IAs whose composition creates capabilities greater than their isolated capabilities, not six applications merely connected by endpoints.

## Six simultaneous engineering fronts
Six conversations may work simultaneously, one per nucleus. Parallel work is intentional. Each front must inspect the latest GitHub state, consume work from other fronts instead of duplicating it, publish exact handoffs, identify parallel dependencies and advance when its assigned stage is complete. It must not wait for unrelated work.

GitHub is the Engineering Control Plane and shared asynchronous memory for the six fronts. It is not a runtime dependency of Soul Mesh.

## Cross-front communication
Every coherent change must leave a machine-readable and human-readable handoff containing: COMMIT_SHA, BRANCH, FILES_CHANGED, CAPABILITIES_CHANGED, TOOLS_CHANGED, AGENTS_CHANGED, CONTRACT_CHANGES, DEPENDENCIES, VERIFIED_BY_GITHUB, NEXT_TASK, KNOWN_LIMITATIONS. The receiving front must READ the handoff, verify the referenced implementation in GitHub and CONSUME it. A front must treat newer commits from another conversation as authoritative progress until re-audited.

## Pair means IA + IA + capability composition
A pair is not merely a network link. Audit both sides for identity, agents, tools, registries, executable handlers, Mesh input/output, discovery, ownership, authorization, fallback, retry/timeout/circuit behavior, correlation/tracing, data/context contracts, complementary and redundant capabilities, latency, parallelism and delegation.

A pair is complete only when meaningful work can flow bidirectionally and the receiving IA executes through its real runtime/agent/tool owner. Ping, acknowledgement, mock handler or HTTP 200 alone is never proof.

## Ordered sequence
Do not process connections randomly. Investigate and preserve the intended sequence because each completed connection may be a prerequisite for the next. Current composition stages:

1. N01 ↔ N02
2. N03 ↔ N04
3. N05 ↔ N06
4. (N01+N02) ↔ (N03+N04)
5. (N01+N02+N03+N04) ↔ (N05+N06)
6. complete N01–N06 cooperative Mesh

Where independent dependencies permit, two connections are developed simultaneously. Do not jump randomly between stages merely because another nucleus is easier.

## Two-connections-per-stage principle
Simultaneous means genuinely parallel where dependencies permit. Two compatible connections may progress together. When a nucleus is shared by two active connections, publish its interface contract and handoff early so both fronts consume the same GitHub truth without overwriting one another. Every connection must state what it produces for the next connection.

## Multiplicative objective
For every connection determine: what A provides to B, what B provides to A, and what new capability emerges from their combination. Target pattern:

A capability → B transformation → combined capability → next pair consumes combined capability.

The four-nucleus composition must be stronger than either isolated pair through shared context, complementary agents/tools, delegation, reusable outputs and reduced redundant computation. The six-nucleus composition must be stronger again.

## Runtime Mesh contract
Every cross-nucleus request preserves source, target, capability, requestId/correlationId and protocol/contract version. Responses return an actual structured result or truthful structured error. Context and trace identifiers survive delegation hops.

Separate concerns: discovery resolves peers; transport carries messages; Mesh validates contracts; ownership selects execution; the real nucleus runtime/agent/tool executes; response returns with correlation preserved. Do not create a parallel API merely to bypass existing Mesh. Extend existing transports/adapters where appropriate.

## Ownership and delegation
Every capability has an authoritative owner, consumers and fallback policy. Local handlers may remain for resilience, but ownership determines authoritative execution. If a nucleus cannot execute a requested capability, delegate through Mesh rather than fabricate a result.

## Work protocol
READ → MAP → CLAIM → MODIFY → VALIDATE → HANDOFF → CONSUME.

READ latest GitHub state. MAP existing agents, tools, registries, handlers, transports and contracts. CLAIM the concrete task/dependency. MODIFY only missing or defective behavior. VALIDATE available static/build/test checks while distinguishing structural verification from runtime proof. HANDOFF exact commit and next task. CONSUME by verifying and building on the handoff.

## Conflict prevention
Before modifying a file, verify its current GitHub SHA/state. If another front changed an affected interface, re-audit and integrate rather than overwrite. Never revert newer work because an older conversation assumption differs.

## Validation truthfulness
Never report unexecuted E2E as passing. Static inspection can establish structure and compatibility but cannot prove live inter-process communication. Runtime proof requires actual execution. If runtime is unavailable, continue all work possible from GitHub and label runtime validation unverified.

## No false completion
A nucleus or pair is not complete because files were created. Completion requires intended capability paths, real handlers, coherent bidirectional contracts, ownership/delegation, preserved existing behavior, relevant executable checks passing, implementation present in GitHub, handoff recorded and limitations explicit.

## Optimization priorities
Prefer correctness, compatibility, reuse, low latency, safe parallelism, resilience, observability, security, maintainability and composability. Never sacrifice correctness or traceability merely for speed.

## Cross-front learning loop
Each front publishes reusable discoveries: interface patterns, incompatibilities, ownership findings, bottlenecks, transport constraints, tests and fixes. Relevant discoveries become inputs to other fronts. Thus six conversations become one coordinated engineering swarm.

## Handoff requirement
After every coherent change publish: WHAT WAS DONE → WHAT WAS VERIFIED → WHAT REMAINS → WHAT THE NEXT FRONT SHOULD DO → WHAT DEPENDENCIES IT CAN CONSUME. The next front begins by reading that state and checking GitHub itself.

## End state
N01 IA ↔ N02 IA ↔ N03 IA ↔ N04 IA ↔ N05 IA ↔ N06 IA.

Each nucleus retains identity and specialization. Soul Mesh supplies discovery, bidirectional communication, delegation, correlation, ownership, resilience and cooperative execution. Engineering mirrors the architecture: six independent fronts, simultaneous compatible pair work, ordered composition, continuous GitHub handoff, and progressive fusion from two nuclei to four and finally six.
