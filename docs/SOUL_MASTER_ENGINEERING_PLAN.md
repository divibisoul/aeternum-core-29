# SOUL — Master Engineering Plan

Status: forensic baseline 2026-09-01

## 1. Product model

SOUL is a distributed intelligence composed of independent AI nuclei. Each nucleus owns a real runtime, capabilities, tools and agents, while the Soul Mesh provides interoperability and composition. The Neo Cortex/orchestrator coordinates without replacing nucleus ownership.

The current GitHub estate contains N01-N06 plus a separate `Orquestrador-` compute-plane repository. A global search found no `N07` repository/branch/reference; N07 is therefore a future architectural requirement, not an implemented runtime.

## 2. Non-negotiable engineering rules

- Never create a competing Mesh, Router, Registry or Transport when an existing implementation can be reused or fused.
- Capability declaration is not proof of executability. Only runtime-backed capabilities are eligible for remote execution or composition.
- A commercial tool is valid only when the full path exists: implementation -> runtime/context -> Mesh -> authorization -> user-facing invocation -> error handling -> test evidence.
- Multiple transports are allowed because SOUL is intentionally hybrid, but each must be identifiable, justified and observable.
- Before every modification: inspect current main, inspect recent commits, inspect the exact file, identify concurrent changes, then patch minimally.
- After every modification: reread the changed files from GitHub, verify the resulting commit, inspect CI/workflows, and verify that concurrent work was not overwritten.
- Any discovered failure is corrected before the current stage is considered complete.
- Never treat file presence, HTTP 200, static configuration or a skipped test as proof of operational functionality.
- Feature flags default to false unless an already-live contract requires otherwise.
- Preserve the TCE and Tríplice; the Orquestrador remains a separate compute plane unless a later product decision changes that.

## 3. Canonical contract truth

The currently observed Mesh implementation uses contract version `1.1.0`. Do not downgrade the live protocol to `1.0` merely because an earlier plan says so. Compatibility adapters may accept older envelopes where required, but canonical responses remain on the current contract until a deliberate protocol migration is approved.

## 4. Architecture layers

1. Nuclei: N01-N06 independent AI runtimes.
2. Mesh fabric: handshake, discovery, registry, routing, transport, multiplex, health, security, async jobs and telemetry.
3. Capability graph: executable capability ownership and composability.
4. Neo Cortex/orchestration: planning and policy over the existing Mesh.
5. Product interface: Android APK / Android Studio project / user-facing tools.
6. Future N07: architectural placeholder only until an explicit repository/runtime is identified or created.

## 5. Evidence levels

- SPEC: documented.
- CODE: implemented in repository.
- INTEGRATED: connected to existing runtime/path.
- TESTED: automated/manual test actually executed.
- ONLINE: real deployment-to-deployment execution verified.
- PRODUCT READY: user-facing flow works end to end.

No stage may claim a higher level without evidence.

## 6. Program order

Phase 0 — forensic baseline and concurrent-front mapping.
Phase 1 — unblock CI/builds.
Phase 2 — align canonical Mesh contract.
Phase 3 — real capability discovery.
Phase 4 — health, circuit breaker and deduplication cleanup.
Phase 5 — TCE compute-plane interface without Mesh registration.
Phase 6 — real-function proofs and closure of pending work.
Phase 7 — N07 future mapping only; no implementation until architecture/product decision.

The earlier 18 engineering workstreams remain valid as implementation sub-workstreams; this plan is the governing synthesis, not a replacement for them.

## 7. Current repositories

- N01: `divibisoul/aeternum-core-29`
- N02: `divibisoul/Eternium-`
- N03: `divibisoul/nexus-aeternum-fusion`
- N04: `divibisoul/nextjs-ai-chatbots`
- N05: `divibisoul/nextjs-ai-chatbot`
- N06: `divibisoul/nextjs-ai-chatbot-2000`
- Compute plane: `divibisoul/Orquestrador-`

## 8. Current concurrency signal

Recent commits show active parallel work, especially in N04, N05, N06, N03 and N01. Therefore stale snapshots are forbidden. The main branch at the moment of each task is the only valid base for that task.

## 9. Product readiness rule

SOUL is not considered commercially ready until the APK/UI, nucleus runtimes, Mesh paths, tools, agents, authentication, observability, CI and real online execution are all evidenced. The goal is a working product, not a convincing simulation.
