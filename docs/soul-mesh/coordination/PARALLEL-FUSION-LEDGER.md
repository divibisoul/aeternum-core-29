# SOUL — Parallel Fusion Ledger

## Authority
This ledger is coordination state derived from current GitHub repository inspections. It is not runtime proof. Each receiving front must verify the referenced repository state before consuming it.

## Parallel pair fronts

### Pair A — N01 ↔ N02
N01 has canonical Mesh protocol, router, capability registry, agent registry and explicit N01N02HybridLink. N01 currently owns cognitive/runtime capabilities including `cognitive.intent`, `agi.process`, `ai.reasoning` and Android context capabilities. N02 has a real provider bridge and capability runtime/agent registry exposing `ai.generate`, `ai.multimodal` and `cognitive-processing`.

Primary composition targets:
- intent → provider generation;
- N01 reasoning ↔ N02 generation;
- N01 AGI processing ↔ N02 cognitive processing;
- Android/runtime context → N02 cognitive processing;
- N02 generation → N01 reasoning → N02 cognitive processing feedback loop.

State: ARCHITECTURALLY MAPPED; live bidirectional E2E remains to be proven.

### Pair B — N03 ↔ N04
Current N03 GitHub inspection shows `api/soul-mesh.ts`, real audio adapters, `N03_AUDIO_CAPABILITIES`, peer registration, HMAC validation and handlers for `audio.transcribe`, `audio.analyze.emotion`, `speech.synthesize`, `mesh.ping`, `mesh.describe` and `capability.list`. N04 current code search did not locate `soul-mesh` files.

Primary composition target:
- N03 perception/audio evidence → N04 artifact/document/tool processing → N03 feedback.

Important consequence: N03 already has executable multimodal/audio capabilities; N04 is the missing Mesh-side integration surface and must be inspected before adding any bridge.

State: N03 EXECUTABLE SURFACE MAPPED; N04 MESH SURFACE NOT LOCATED BY CURRENT SEARCH; do not mark connected.

### Pair C — N05 ↔ N06
Current N05 code search did not locate `soul-mesh` files. Current N06 inspection shows a substantial Mesh surface including `app/api/soul-mesh/route.ts`, discovery, endpoint, `N06N01Bridge`, peer adapters, protocol, a native capability runtime and `N06SynergyOrchestrator`.

Primary composition target:
- N05 inference → N06 planning/validation/cognition → N05 refined inference.

State: N06 Mesh surface mapped; N05 Mesh surface must be re-audited in its current repository state before any bridge is added.

## Fusion sequence

Stage 1: N01 + N02
Stage 2: N03 + N04
Stage 3: N05 + N06
Stage 4: (N01+N02) + (N03+N04)
Stage 5: (N01+N02+N03+N04) + (N05+N06)
Stage 6: full N01–N06 Mesh

Independent pair stages are developed simultaneously. A completed pair emits a contract/artifact consumed by the next stage.

## Cross-product rule
For each fusion evaluate:

`capability × capability`
`agent × agent`
`tool × tool`
`agent × tool`
`context × capability`
`delegation × capability`

A fusion must produce at least one new executable workflow requiring contributions from both sides. Mere endpoint reachability is insufficient.

## Four-nucleus target
The first four-nucleus fusion is not simply two pair endpoints connected together. It should compose the outputs of Pair A and Pair B. A reference chain is:

`N01 intent/context → N02 cognitive generation → N03 perception/evidence → N04 artifact/tool execution → N02 synthesis → N01 orchestration`

The exact capabilities must be selected from live registries at implementation time; do not invent unavailable handlers.

## Six-nucleus target
The final composition should permit dynamic delegation across all specialized owners while preserving identity, ownership, correlation, context boundaries and execution authority.

Reference shape:

`N01 context → N02 reasoning → N03 perception → N04 artifact/tool → N05 inference → N06 cognition/validation → N01 orchestration`

This is a target composition graph, not a claim that the runtime currently executes it.

## Parallel-front rule
Every front must publish:
- exact repository/branch;
- current commit SHA;
- files actually changed;
- capability/agent/tool changes;
- tests actually executed;
- runtime proof status;
- dependencies for the next front;
- conflicts found with other fronts.

No front may overwrite another front's newer work. Re-audit before changing shared contracts.

## Current ledger truth
- N01/N02: mapped; synergy contract added in N01.
- N03/N04: N03 executable Mesh mapped; N04 Mesh not located by current search.
- N05/N06: N06 Mesh mapped; N05 Mesh not located by current search.
- Four- and six-nucleus fusion: not runtime-proven.
- 60 directional channel endpoints: architectural target; not equivalent to 60 verified executions.
