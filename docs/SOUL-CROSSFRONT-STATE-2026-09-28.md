# SOUL — Cross-Front Forensic State 2026-09-28

## Purpose

This document is a durable coordination map for the current SOUL/SARA infrastructure. It is additive to previous plans and does not cancel any previous front.

The engineering loop is:

DETECT → DIAGNOSE → RESEARCH → CORRECT → COMPLETE → CONNECT → OPTIMIZE → VALIDATE → DOCUMENT → RE-AUDIT

No repository is treated as a substitute for another nucleus. A capability keeps its owner and identity; the Octacore adds an execution/federation layer above the existing runtimes.

## System identity

SOUL is a federated AI/OS runtime composed of N01–N07 plus the independent SARA authority.

Octacore is the system processor / system-GPU software fabric over G0–G7:

- G0 = SARA — regenerative/ethical authority
- G1 = N01 — Android host/edge/Mesh gateway
- G2 = N02 — conversation/provider runtime
- G3 = N03 — perception/audio/multimodal runtime
- G4 = N04 — tools/documents/research/execution runtime
- G5 = N05 — inference/runtime gateway
- G6 = N06 — cognition/session/tool runtime
- G7 = N07 — scheduling, SuperGPU software runtime, Mesh delegation, correlation

It is not a silicon CPU, a physical GPU, or a CUDA/NPU claim.

## Current cross-front matrix

| Slot | Source of truth | Real implementation found | Current integration state |
|---|---|---|---|
| G0 | SARA | SistemaVivo + RegenerativeLoop + ARA/ETR/ITR + VagusNerveBus | G0 kernel adapter added; serial authority + bounded cycle queue |
| G1 | aeternum-core-29 | Android host, Soul Mesh gateway, ClareiraBridge/ProjetoClareira | Host boundary real; Clareira ingress changed from false accepted queueing to explicit runtime delivery/retry |
| G2 | Eternium- | N02 capability runtime + Mesh endpoint | Octacore execution boundary over existing runtime |
| G3 | nexus-aeternum-fusion | N03 SoulMeshRouter + audio/Gemini capabilities | Octacore execution boundary over canonical router |
| G4 | nextjs-ai-chatbots | Nucleus04Processor + native tools + Mesh | Bounded N04WorkerPool now backs batch.process/parallel.map |
| G5 | nextjs-ai-chatbot | N05 canonical gateway + inference agents | Octacore execution boundary over canonical gateway |
| G6 | nextjs-ai-chatbot-2000 | N06 processor + capability dispatcher | Octacore execution boundary over existing dispatcher |
| G7 | Orquestrador- | existing SuperGPU runtime + Mesh peer client + Octacore scheduler | Canonical Octacore processor reuses the pre-existing SuperGPU runtime |

## Control/data separation

VagusBus is the control plane: health, capability, throttle, degrade, halt, resume and GPU control envelopes.

Soul Mesh remains the data/execution plane: discovery, capability routing, delegation, execution and correlated response.

No second Mesh is introduced by this reconciliation.

## Evidence discipline

IMPLEMENTED means source-level implementation exists.

CONNECTED means the code path is wired to the existing owner/runtime.

VALIDATED requires an executable test or live run.

ONLINE requires a real reachable service and successful correlated transaction.

Repository presence alone is never evidence of runtime liveness.

## Current gaps that must remain explicit

- N01 Clareira runtime adapter is real source code but production commissioning is still open; its TypeScript execution path requires an actual supported TS runtime configuration. Node's official TypeScript documentation states that native type stripping requires explicit file extensions for imports, while tsx provides a full TypeScript execution path. No claim of live Clareira runtime is made here.
- N06 exact historical CollaborationSessionRunner was not recovered by the current repository search. No fabricated implementation is advertised. Existing N06 dispatcher remains the execution boundary until an authoritative runner implementation is found.
- context.probabilistic and any exact Dirichlet/Laplace + neural fusion module must remain tied to the authoritative file if/when found; no duplicate implementation is created here.
- WebGPU remains capability-detected only. MDN documents that navigator.gpu is restricted to secure contexts and requestAdapter() can resolve to null; the Octacore runtime therefore must fail closed when no real adapter exists.
- Cross-service correlation should converge toward standard trace context in addition to existing Soul correlation IDs. W3C Trace Context standardizes propagation of request context across HTTP services.
- Retry/backoff remains bounded and failure-aware. AWS guidance emphasizes timeouts, retry controls, jitter, rate limiting/load shedding, queue-depth management and circuit breakers for resilient distributed systems.

## Non-destructive invariant

No file or capability was removed by this reconciliation brancheset. Changes that replace lines are corrective rewrites of the same contract; they are not deletion of the underlying capability.

Previous PRs and branches remain preserved for later forensic merge/rebase decisions.
