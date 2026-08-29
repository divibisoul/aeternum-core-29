# SOUL N01 ↔ N02 — LIVE HANDOFF

## Purpose
Shared coordination record for the six parallel SOUL engineering fronts. GitHub state is authoritative. Never assume another conversation has or has not completed work; inspect the repository before modifying it.

## Current workstream
N01 and N02 are being advanced as a pair. The goal is not merely transport connectivity. The pair must support cooperative execution in which agents, tools, capabilities and AI runtimes complement and enrich one another in both directions.

## Completed / established in this workstream
- N01 remains the reference communication/transport architecture.
- N02 is treated as an independent AI nucleus, not a passive API endpoint.
- Cross-nucleus messages use the canonical Soul Mesh envelope and correlation semantics already present in the repositories.
- Capability ownership must remain with the nucleus that implements it.
- Remote execution must return a canonical result rather than a transport-only acknowledgement.
- Existing functionality must be preserved and evolved; do not replace working subsystems merely to introduce another abstraction.

## Active next work
1. Audit the actual N01 and N02 capability registries and agent/tool registries from the current branch.
2. Map each remotely callable capability to its real owner and executable handler.
3. Build the smallest compatible composition layer so N01 can request N02 agent/tool/capability assistance and N02 can request N01 assistance.
4. Preserve local execution paths and make remote execution an additive path.
5. Carry requestId/correlationId, source, target, capability and contract version through the complete request/result lifecycle.
6. Record every completed change here and update the next task before handing work to another front.

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

## Concurrency rule
A later front must re-read current GitHub state before applying this handoff. This document is coordination memory, not permission to assume the code is unchanged.

## Verification rule
If runtime execution cannot currently be performed, state that limitation explicitly. Static/code-level integration may continue, but no unexecuted E2E path may be labelled proven.
