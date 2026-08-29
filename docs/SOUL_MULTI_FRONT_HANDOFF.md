# SOUL — Multi-Front Engineering Handoff

## Purpose

This file is the shared engineering handoff for the six simultaneous SOUL work fronts. It is not a runtime dependency of Soul Mesh. It exists so each parallel engineering conversation can publish completed work, discoveries, blockers, and the exact next task for the other fronts.

## Operating protocol

Each front must follow:

1. READ — inspect the current repository state and existing handoffs before changing code.
2. CLAIM — state the exact task being worked on.
3. MODIFY — preserve existing working code; add, optimize, connect, or deprecate without destructive deletion.
4. VALIDATE — inspect the changed code and run the strongest available static/build/test validation.
5. HANDOFF — record what actually changed, validation evidence, unresolved issues, and the next front that should consume it.
6. CONSUME — the receiving front reads this file and the source repository before duplicating work.

## Parallel topology

- Pair 1: N01 <-> N02
- Pair 2: N03 <-> N04
- Pair 3: N05 <-> N06

The three pairs work simultaneously. A pair does not wait for unrelated pairs. A completed capability becomes an input for the next composition stage.

## Composition stages

1. N01+N02
2. N03+N04
3. N05+N06
4. (N01+N02)+(N03+N04)
5. (N01+N02+N03+N04)+(N05+N06)
6. Full N01–N06 mesh

## Required handoff fields

Every completed front must publish:

- FRONT
- TASK
- STATUS
- CHANGED_PATHS
- EXISTING_WORK_REUSED
- VALIDATION
- DISCOVERED_PROBLEMS
- DEPENDENCIES
- NEXT_CONSUMER
- NEXT_TASK
- DO_NOT_DUPLICATE

## Current handoff — N05/N06

FRONT: N05/N06
TASK: establish complementary agent-to-agent cooperation rather than simple endpoint connectivity.
STATUS: IN PROGRESS
CHANGED_PATHS: N05 mesh synergy layer; N06 mesh synergy layer.
EXISTING_WORK_REUSED: N05 inference/runtime and N06 planning/validation/capability-combo infrastructure.
VALIDATION: source-level compatibility review performed after implementation; correlation/trace propagation is required across the pair.
DISCOVERED_PROBLEMS: runtime E2E still requires both processes to be available; static source presence is not proof of live communication.
DEPENDENCIES: real N05 and N06 endpoints and their existing Mesh contracts.
NEXT_CONSUMER: N01/N02 and N03/N04 fronts should inspect this pattern before implementing their own pair synergy.
NEXT_TASK: identify the strongest complementary agent/capability combinations in N01/N02 and N03/N04, then publish their handoffs here without copying N05/N06 blindly.
DO_NOT_DUPLICATE: do not recreate an existing Mesh protocol, correlation model, or capability-combo mechanism merely under a different filename.

## Rules for all six fronts

- The GitHub repository state is the source of truth for implementation status.
- Never claim a feature is operational merely because a file or endpoint exists.
- Distinguish declared capability, implemented handler, reachable endpoint, and verified E2E execution.
- Preserve existing functionality; do not delete working functionality to obtain architectural purity.
- Search other front handoffs before creating a parallel implementation.
- A discovered blocker must be recorded so another front can solve it instead of repeating the investigation.
- Each pair must produce a capability combination that is more useful than either isolated capability.
- The final six-core system must remain six independent IAs cooperating through Soul Mesh, not six copies of one runtime.
