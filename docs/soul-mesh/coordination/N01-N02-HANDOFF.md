# SOUL N01 ↔ N02 — LIVE HANDOFF

## Purpose
Shared coordination record for the six parallel SOUL engineering fronts. GitHub state is authoritative. Never assume another conversation has or has not completed work; inspect the repository before modifying it.

## Current workstream
N01 and N02 are being advanced as a pair. The goal is not merely transport connectivity. The pair must support cooperative execution in which agents, tools, capabilities and AI runtimes complement and enrich one another in both directions.

## Completed / established in this workstream
- N01 remains the reference communication/transport architecture.
- N02 is treated as an independent AI nucleus, not a passive API endpoint.
- Cross-nucleus messages use the canonical Soul Mesh envelope and correlation semantics already present in the repositories.
- Capability ownership remains with the nucleus that implements it.
- Remote execution must return a canonical result rather than a transport-only acknowledgement.
- Existing functionality is preserved and evolved; working subsystems are not replaced merely to introduce another abstraction.
- The unified six-front execution directive is present in `docs/soul-mesh/coordination/UNIFIED-LAST-5-DIRECTIVES.md`.
- N01's current repository contains the N01↔N02 hybrid link, N01 agent registry, capability registry, router, discovery, transport and ownership components.
- N02's current repository contains `api/soul-mesh.ts`, `N02CapabilityRuntime`, `N02AIProviderBridge` and `N02AgentRegistry`; the provider bridge currently exposes `ai.generate`, `ai.multimodal` and `cognitive-processing` through the real provider/runtime path.
- Added `docs/SOUL-N01-N02-SYNERGY-FUSION.md`, defining the capability cross-product and higher-order N01↔N02 composition graphs.

## Synergy targets now recorded
- `N01.cognitive.intent × N02.ai.generate` → intent-aware response planning.
- `N01.ai.reasoning × N02.ai.generate` → context-grounded reasoning + generation.
- `N01.agi.process × N02.cognitive-processing` → AGI processing with provider-backed cognitive execution.
- `N01.android.* × N02.cognitive-processing/ai.generate` → runtime-aware and resource-aware processing.
- `N02.generate → N01.reasoning → N02.cognitive-processing` → bidirectional feedback loop suitable as a seed for later four-nucleus fusion.

These are architectural composition targets, not claims of runtime verification.

## Active next work
1. Re-audit the actual N01 and N02 capability/agent/tool registries immediately before implementation changes.
2. Map each remotely callable capability to its real owner and executable handler.
3. Implement the smallest compatible composition layer so N01 can request N02 assistance and N02 can request N01 assistance.
4. Preserve local execution paths; remote execution remains additive.
5. Carry requestId/correlationId, source, target, capability and contract version through the complete lifecycle.
6. Turn the recorded synergy targets into executable workflows, beginning with one real bidirectional capability path and then a feedback-loop path.
7. Leave exact commit/test evidence for the next front.

## Handoff contract
Every front modifying this system must record:
- COMMIT_SHA
- BRANCH
- FILES_CHANGED
- CAPABILITIES_CHANGED
- TOOLS_CHANGED
- AGENTS_CHANGED
- CONTRACT_CHANGES
- DEPENDENCIES
- VERIFIED_BY_GITHUB
- NEXT_TASK
- KNOWN_LIMITATIONS

## Latest additive artifact
- COMMIT_SHA: `cacb9c737d6abd7d84cb9ca0ba6082ec19010047`
- BRANCH: `main`
- FILES_CHANGED: `docs/SOUL-N01-N02-SYNERGY-FUSION.md`
- CAPABILITIES_CHANGED: none; composition contract only
- TOOLS_CHANGED: none
- AGENTS_CHANGED: none
- CONTRACT_CHANGES: additive N01↔N02 synergy/fusion contract
- DEPENDENCIES: current N01 Mesh stack; current N02 runtime/provider bridge
- VERIFIED_BY_GITHUB: file creation committed and available on main
- NEXT_TASK: implement and verify the first real bidirectional N01↔N02 capability composition without duplicating existing handlers
- KNOWN_LIMITATIONS: live cross-process E2E execution has not been proven by this documentation-only artifact

## Concurrency rule
A later front must re-read current GitHub state before applying this handoff. This document is coordination memory, not permission to assume the code is unchanged.

## Verification rule
If runtime execution cannot currently be performed, state that limitation explicitly. Static/code-level integration may continue, but no unexecuted E2E path may be labelled proven.
