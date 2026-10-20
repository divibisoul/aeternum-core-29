# SOUL Fusion Group Contracts — Draft 0.1.0

> **ACTIVE PROVISIONAL RULE v0.1.0 / INTERNAL EXECUTION CONTRACT.**
>
> This document proposes integration boundaries for review. It does not change Soul Mesh v1.1.0, existing public message schemas, HMAC header formats, or any runtime behavior. Do not implement changes that alter a public Mesh contract until the owner explicitly approves the exact schema and compatibility plan.

- Date: 2026-10-19.
- Baseline map: `../SOUL_NUCLEI_CANON.md` at repository root (see `SOUL_NUCLEI_CANON.md`).
- Environment assumption: Docker Compose for local multi-service tests; single-host first. No Kubernetes assumption.
- Compute assumption: CPU-only local integration; model inference goes through an explicitly configured remote provider unless local accelerator support is verified.
- Retry policy is deterministic and bounded; do not use unseeded random jitter.
- Current Mesh envelope and HMAC implementation remain authoritative until inspected and mapped to this draft.

## 1. Proposed common execution envelope (draft only)

Transport-independent logical shape. This is not yet a JSON Schema and must not be published to consumers as a stable wire contract.

```json
{
  "contract_name": "soul-fusion-execution",
  "schema_version": "0.1.0",
  "message_id": "immutable-message-id",
  "idempotency_key": "caller-stable-operation-key",
  "trace_id": "W3C-trace-id",
  "correlation_id": "end-to-end-correlation-id",
  "sequence_index": 0,
  "created_at": "RFC3339-UTC",
  "deadline_at": "RFC3339-UTC",
  "source": {"nucleus_id": "N01", "component": "adapter", "version": "pinned-build"},
  "target": {"group_id": "A", "capability": "execute-plan"},
  "operation": "execute",
  "input_ref": "immutable-input-reference",
  "payload": {},
  "result_ref": null,
  "evidence_refs": [],
  "status": "PENDING",
  "error": null
}
```

Required invariants: stable message and idempotency IDs on retry; trace/correlation IDs propagate unchanged; sequence numbers are monotonic within the source stream; statuses are explicit and never infer success from a queued job; large payloads are referenced, not copied through every group; result and evidence references are immutable or content-addressed. Secret material is never placed in `payload`.

## 2. Cross-cutting boundary policy

| Concern | Draft rule | Must be verified before activation |
|---|---|---|
| Authentication | Reuse the exact existing N01 Mesh HMAC-SHA256 envelope for current Mesh peers. Do not invent header names or canonicalization rules. | Map the current implementation, clock-skew rules, key ID rotation and replay store from code/tests. |
| Non-Mesh services | HTTPS and service identity required. mTLS or short-lived JWT is the preferred container/service boundary; do not introduce until deployment and credential ownership are approved. | Environment and identity provider are currently unknown. |
| Request deadline | Control calls: 5 s; model inference: 60 s; audio job: 45 s; sandbox code task: 300 s. | Tune against measured p95/p99 and caller cancellation semantics. These are initial targets, not observed timings. |
| Retry | Retry only transient failures; deterministic waits of 200 ms, 500 ms and 1 s; maximum 3 attempts. Do not retry side-effecting calls unless the receiver implements idempotency. | Test duplicate delivery, cancellation and persistent failures. |
| Circuit breaker | Open after 5 consecutive failures in 30 s; probe after 30 s; reset only after a successful probe. | Thresholds are proposals; baseline outage/recovery behavior is not measured. |
| Idempotency | `idempotency_key` plus operation scope and input digest; receiver persists completed/in-flight state. Duplicate requests return the same execution/result reference. | Verify persistence and retention; do not rely on in-memory caches for cross-process safety. |
| Observability | Propagate W3C `traceparent` when supported; preserve `trace_id`, `correlation_id`, `message_id` and `sequence_index` in Mesh metadata/logs. | Avoid logging credentials, prompts containing secrets, or sensitive user content. |
| Failure reporting | Error class is one of `CODE`, `DEPENDENCY`, `CI`, `ENVIRONMENT`, `LICENSE`, `TIMEOUT`, `AUTH`, `CONTRACT`. Include command, exit code, SHA and redacted log reference. | Secrets must be redacted while preserving reproducible diagnostics. |
| Promotion | No component promoted from draft based on a successful build alone. Require integration tests, CI URL, pinned commit and comparison against baseline. | Each group defines explicit acceptance tests below. |

## 3. Group contracts, adapters and minimum integration tests

### Group A — Coordination and orchestration

**Members:** N01, N07, LangGraph; CrewAI and MetaGPT are optional specialized-task adapters, not peer control planes.

- **Authority:** N01 owns Mesh routing, registration and transport compatibility. N07 owns control-plane policy, capability authorization and federation. LangGraph owns only the runtime state of one execution graph/checkpoint; it does not own the SOUL identity or canonical state. SARA may veto safety/ethics decisions. Human approval remains required for public-contract changes, deletion, archival or promotion to production.
- **Interface:** existing N01 Mesh/HTTP boundary. Calls to N07 use its currently documented API; do not invent endpoints. LangGraph is invoked through an internal adapter first. CrewAI/MetaGPT execute only when explicitly selected by the graph.
- **Adapter:** `SoulMeshAdapter` translates between existing Mesh envelopes and a version-pinned orchestration input/output DTO without deleting legacy fields.
- **Minimum tests:** schema compatibility; N01→N07 and N07→N01 authenticated calls; trace propagation; crash/restart checkpoint; duplicate idempotency key; timeout then resume; prove N01 and N07 authority does not conflict.
- **Synergy verdict:** **UNPROVEN** until comparison against the existing N01/N07 path; do not add multiple competing orchestrators.

### Group B — Autonomous execution

**Members:** OpenHands executor; SuperAGI reference only.

- **Interface:** OpenHands Agent Server REST API or a supported ACP adapter. Sandbox control stays behind a dedicated executor adapter; do not call arbitrary local shell from N01/N07.
- **Adapter:** `ExecutorAdapter` accepts a scoped work item, pinned repository/ref, permitted path set, command allowlist, timeout and output limit; returns execution ID, changed-file manifest, test results and artifact refs.
- **Security:** run untrusted code in an isolated container/workspace without default production credentials. Grant only a short-lived branch-scoped GitHub token with minimum permissions. Never grant force-push or default-branch writes.
- **Minimum tests:** hostile repo isolation; denied network/secret access; file scope enforcement; idempotent retry; kill at deadline; correct exit code and complete redacted log capture; create branch changes only after an explicit operator action.
- **Synergy verdict:** **POTENTIAL**; must compare completion correctness, time, cost and recovery rate to the existing coding workflow.

### Group C — Regenerative cognition and ethics

**Members:** SARA; OpenCog Hyperon behind an adapter; JARVIS architecture is reference-only.

- **Interface:** internal Python interface for SARA; isolated Hyperon service/library adapter for MeTTa/AtomSpace queries. JARVIS code is not copied; repository license has not been confirmed as permissive.
- **Adapter:** `CognitionAdapter.evaluate(context_ref, goal_ref)` returns typed recommendations, rule/derivation refs, abstention reason and safety decision. It may recommend or veto; it must not silently mutate the canonical nucleus registry or delete state.
- **Minimum tests:** deterministic replay with identical inputs; provenance for every derived conclusion; unknown/contradictory facts cause explicit abstention; SARA safety veto is enforced; Hyperon crash is isolated and falls back without treating missing output as approval.
- **Synergy verdict:** **EXPERIMENTAL / UNPROVEN** until benchmarked against SARA alone for correctness, rule coverage, false approvals and latency.

### Group D — Interface and chat

**Members:** `Eternium-`; canonical `nextjs-ai-chatbot-2000`; Taipy internal dashboards only. `nextjs-ai-chatbot` and `nextjs-ai-chatbots` are out of scope for new feature work and candidates to archive after the unique-code audit.

- **Interface:** browser → existing frontend routes/API → SOUL gateway; internal operations dashboard is a separate Taipy service. Avoid browser-to-model direct calls and do not expose internal credentials to frontend code.
- **Adapter:** one stable typed client maps chat input/output, citations, task status and error states to the SOUL gateway. Unique modules from the two noncanonical apps must be inventoried and selectively carried over before they are marked safe to archive.
- **Minimum tests:** login/auth boundary; chat streaming; refresh/reconnect; citation/provenance rendering; keyboard/mobile behavior; permission-denied and service-down states; no secret leaks in JS bundles.
- **Synergy verdict:** **UNPROVEN** until canonical app builds and feature-parity inventory passes; the canonical choice does not imply the other repos are safe to delete.

### Group E — Audio and speech

**Member:** N03 `nexus-aeternum-fusion`; no external repository merge.

- **Interface:** existing authenticated N01 Mesh envelope. Provider adapters are isolated behind N03 interfaces for Google Speech/TTS and supported Hugging Face speech models.
- **Adapter:** `SpeechProviderAdapter` reports provider, model/version, locale, audio format, latency, duration, usage/cost metadata and immutable audio artifact reference. Keep streaming/binary audio payloads off the generic JSON envelope; pass content-addressed artifact refs.
- **Minimum tests:** provider unavailable; malformed audio; timeout/cancellation; MIME/sample-rate validation; secrets absent from logs; real provider test is separately gated from deterministic unit tests; verify the N01↔N03 authenticated round trip.
- **Synergy verdict:** **PARTIAL** only after provider adapters are found; the existing N03 CI passing is not evidence that every requested provider is integrated.

### Group F — Model runtime

**Members:** Transformers as model access layer; PyTorch as initial backend; Keras optional; TensorFlow and JAX isolated only where a specific model requires them.

- **Interface:** versioned internal HTTP inference service, with request/result schemas and health/readiness endpoints. Do not load all five frameworks into one environment.
- **Adapter:** `ModelAdapter` declares capability, model ID/revision, tokenizer/config revision, backend, device, resource limits, input/output schema and license. Model weights must have their own license and immutable revision.
- **Minimum tests:** CPU smoke inference; malformed input; output schema; timeout and cancellation; deterministic/repeatability envelope where supported; memory budget; model/license allowlist; backend worker restart. A remote provider must be explicit in configuration.
- **Synergy verdict:** **UNPROVEN** until a single selected model improves task correctness or latency/cost against the current provider, with metrics captured on the same workload.

### Group G — Data, events and provenance

**Members:** Prefect for recoverable workflows; Redpanda Connect for connectors/streaming only after component-license approval; Marquez/OpenLineage for lineage.

- **Interface:** Mesh/HTTP for command/query; event transport only if a broker/Connect deployment is approved; OpenLineage events to Marquez. Do not assume Redpanda is installed in the current environment.
- **Adapter:** `ProvenanceAdapter` writes input dataset refs, transformation/version, execution ID, output artifact digest and evidence refs. Duplicate event delivery must be harmless.
- **Minimum tests:** event duplicate and reorder; retry after partial failure; lineage graph connects input→job/run→output; unknown artifact ref fails visibly; database/broker outage; access-control tests for metadata endpoints.
- **Synergy verdict:** **POTENTIAL**; gain is measurable only when lineage completeness and failure recovery are compared with the present logs/storage.

### Group H — Concurrent operators

- **Interface:** internal message contract from A with mandatory group/agent identity, tool permissions, trace/correlation IDs and lease/deadline.
- **Adapter:** `OperatorRegistry` loads a declarative role and permission manifest. Every operator gets an isolated worktree/container and output namespace. Only A can authorize cross-group calls. No group may amend another group’s branch without delegated permission.
- **Minimum tests:** parallel calls cannot overwrite one another; idempotency under duplicate messages; cancellation; permission denial; trace IDs survive A→B→C→F→G; all concurrent writes are attributable to an actor and SHA.
- **Synergy verdict:** **UNPROVEN** until parallel completion is compared against sequential baseline without increasing data loss, unauthorized actions or defect rate.

## 4. End-to-end acceptance path

The target real flow is:

1. A receives an actual user request and persists an execution ID.
2. B executes one permitted, isolated task and returns logs/tests/artifact refs.
3. C evaluates the result and records the safety decision/provenance.
4. F performs an actual configured model inference and records the model/backend revision.
5. G records lineage connecting request inputs, execution, cognition output, model output and the final response artifact.
6. A returns the correlated result to D/E as appropriate.

A group being skipped, mocked, queued, or substituted with fabricated output does not count. A skip must appear as `SKIP`, not `PASS`. The full flow has not yet been executed or demonstrated by this draft.

## 5. Baseline and synergy measurements

Before integration, capture the same workload on the current system and record SHA, command, exit code, input fixture digest and CI URL.

| Metric | Baseline | Integrated result | Acceptance rule |
|---|---|---|---|
| Correctness | Not measured in this draft | Not measured | No regression; target improvement on a preregistered representative task set. |
| p50/p95 latency | Not measured | Not measured | Report absolute and relative values; accept only against an agreed SLO. |
| Cost per successful task | Not measured | Not measured | Include model/API cost and compute time; no claim of gain without measurement. |
| Recovery after injected failure | Not measured | Not measured | Resume without duplicate side effects or loss of sequence/provenance. |
| Provenance completeness | Not measured | Not measured | Every artifact resolves to input refs, transformation version, SHA and execution trace. |
| Security/permission violations | Not measured | Not measured | Zero unauthorized operations in the test suite. |

The synergy verdict remains **UNPROVEN** until tests compare the same workload, data, and acceptance criteria before and after. Successful compilation alone is not a synergy metric.

## 6. Activation gates

- Confirm runtime environment and compute provider.
- Freeze exact commit SHAs and license evidence for every adapter.
- Review/approve any proposed public schema and compatibility/versioning strategy before implementation.
- Add integration tests and run them against real components; keep provider calls separately gated where credentials/cost are involved.
- Record failures with command, complete redacted output, SHA, CI URL and classification.
- Do not merge, delete, archive or alter default branches as part of this draft.
- N02 remains gated until the global DoD is completely evidenced and synergy is demonstrated.
