# SOUL — UNIFIED LAST FIVE DIRECTIVES

## Authority
GitHub is the only authoritative state. Parallel ChatGPT conversations are independent workers; never infer their state from conversation memory. Before changing a nucleus, inspect its current GitHub state and recent commits.

## Scope
This protocol unifies the last five directives for the active N01↔N02 workstream and is additive to existing implementation. It does not delete, reset, replace, or invalidate prior work.

## Six-front parallel model
Six independent engineering fronts may work simultaneously, one per nucleus. A front may advance to the next nucleus or pair after its assigned work is complete. Every front must leave machine-readable human-readable handoff state in GitHub so another front can continue without relying on chat history.

## Pair model
N01↔N02 is an active pair. The same pair methodology is reusable for N01↔N03, N01↔N04, N01↔N05 and N01↔N06. Pair work is not limited to network transport: it must compose AI runtimes, agents, tools, capabilities and data while preserving ownership of each nucleus.

## Multiplicative interoperability
A connection is complete only when local and remote capabilities can cooperate. Remote execution is additive: local paths remain valid. A request must identify source, target, capability, requestId/correlationId and contract version. A successful response must carry the canonical result, not merely an acknowledgement. The receiving nucleus must execute through its real runtime/agent/tool/capability owner rather than a fake adapter.

## Work protocol
1. Read current GitHub state.
2. Inspect recent commits/branches relevant to the nucleus or pair.
3. Discover existing registries, agents, tools, capabilities, transports and adapters before adding anything.
4. Integrate and optimize existing implementations instead of duplicating them.
5. Correct concrete defects immediately when identified.
6. Add only the smallest compatible layer required for the missing behavior.
7. Preserve backwards compatibility unless a concrete defect requires a migration.
8. Commit each coherent completed change.
9. Re-read changed files from GitHub after each write.
10. Update the pair handoff with the exact commit and next task.

## No false verification
Static code inspection may establish structural consistency, but runtime E2E must not be labelled proven unless it actually executed. Lack of a test environment is not permission to stop static integration work; it is only a limitation on the verification label.

## Handoff fields
Every front must record: COMMIT_SHA, BRANCH, FILES_CHANGED, CAPABILITIES_CHANGED, TOOLS_CHANGED, AGENTS_CHANGED, CONTRACT_CHANGES, DEPENDENCIES, VERIFIED_BY_GITHUB, NEXT_TASK, KNOWN_LIMITATIONS.

## Current N01↔N02 next task
Audit the real capability/agent/tool registries in both nuclei, map ownership to executable handlers, then implement bidirectional cooperative composition with canonical lifecycle metadata. Preserve local execution and existing Mesh transports. After N01↔N02 is coherent, leave the handoff for the next pair/front rather than assuming its work is complete.

## Cross-front synchronization
A front must treat a new commit from another conversation as potentially authoritative progress. Re-audit affected interfaces before editing. Never overwrite a newer implementation merely because the local conversation started from an older assumption.
