# SOUL_NUCLEI_CANON.md

> **STATUS: PROVISIONAL — SUBJECT TO OWNER REVIEW**
>
> Created during the SOUL integration Phase Zero. This file is a working map of declared responsibilities, not proof that every capability is implemented. Do not use it to delete, replace, or silently reassign existing modules.

## 1. Authority and operating assumptions

- Canonical system-of-record for this inventory: this file until an owner-approved revision is adopted.
- Baseline date: 2026-10-19 local project date (GitHub timestamps below are UTC).
- Existing branches and history are preserved. No default branch is changed by this document.
- Runtime assumption pending owner confirmation: Docker Compose for local integration tests; one service/container per incompatible runtime; no Kubernetes requirement assumed.
- Compute assumption pending owner confirmation: CPU-first for local integration tests; model inference via an explicitly configured remote provider unless a compatible GPU is verified. Do not install PyTorch, TensorFlow and JAX in a shared environment.
- HMAC-SHA256 is the provisional service-to-service authentication mechanism where the current Mesh contract supports it. JWT/mTLS are not introduced without an explicit threat-model decision.
- Unknown implementation status is not PASS. Capability statuses must be labelled IMPLEMENTED, PARTIAL, PROJECTED, BLOCKED or UNMEASURABLE and backed by code/test/CI evidence.

## 2. Provisional nucleus map

| Canonical ID | Current repository / component | Declared responsibility | Provisional implementation assessment | Evidence / caveat |
|---|---|---|---|---|
| N01 | `divibisoul/aeternum-core-29` | Coordination, Soul Mesh discovery/registration, transport facade and routing | **PARTIAL** | README describes `/mesh/health`, `/mesh/discovery`, `/mesh/register`, `/mesh/in`, `/mesh/out` and HMAC envelope support. E2E evidence must be tied to the exact baseline SHA and CI run. |
| N02 | `divibisoul/Eternium-` | Frontend / AGI chat entry point (temporary mapping) | **UNMEASURABLE** | This role is provisional; legacy descriptions also associate Eternium with model-provider/agent work. Resolve ownership by inspecting its code and tests before moving capabilities. |
| N03 | `divibisoul/nexus-aeternum-fusion` | Audio, speech and multimodal audio integrations | **PARTIAL** | Repository and head commit exist; Google Speech/TTS and Hugging Face adapters and their real Mesh E2E results must be independently demonstrated. |
| N04 | Logical responsibility retained from `divibisoul/nextjs-ai-chatbots` | UI, tools, docs and artifacts | **PARTIAL / TO CONSOLIDATE** | Preserve unique capabilities before archiving or excluding the source repo. |
| N05 | Logical responsibility retained from `divibisoul/nextjs-ai-chatbot` | Chat, retrieval, knowledge and dispatch | **PARTIAL / TO CONSOLIDATE** | Preserve unique capabilities before archiving or excluding the source repo. |
| N06 | Logical responsibility retained from `divibisoul/nextjs-ai-chatbot-2000` | Cognition, reasoning, agents and learning bridges | **PARTIAL / TO CONSOLIDATE** | Selected as the physical canonical Next.js repository for the consolidation because GitHub returned a commit for history page 500 (with `per_page=1`) while the two sibling repositories returned no commit at that page. This establishes a higher commit-history bound, not equivalence or merge safety. |
| N07 | `divibisoul/Orquestrador-` | Go control plane, orchestration and federation | **PARTIAL** | Latest baseline commit describes local Mesh capability authentication. Inspect package-level tests and real N01↔N07 CI before declaring end-to-end success. |
| N08 | `divibisoul/SARA` | Regenerative core, ethics / guardrails and GRCE-related processing | **PARTIAL / PROVISIONAL ID** | Repository name and declared capabilities are known, but N08 assignment is provisional pending the authoritative nucleus registry. |
| N09 | `divibisoul/jev-api` (repository exists; role mapping provisional) | Decision, triage and guardrail services | **UNMEASURABLE / PROVISIONAL ID** | GitHub API resolves this repository, but it is not among the eight repositories frozen in this phase. Its language metadata is HTML and its responsibilities must be confirmed from actual source and tests; freeze its SHA/license separately before depending on it. |

### Next.js repository disposition

- **Physical canonical target:** `divibisoul/nextjs-ai-chatbot-2000`.
- **Out of scope for new feature development, candidates to archive after preservation audit:** `divibisoul/nextjs-ai-chatbot` and `divibisoul/nextjs-ai-chatbots`.
- This designation is administrative only. It does **not** authorize archiving, deleting, removing dependencies, or discarding unique code. First inventory their diffs, tests, open PRs, workflows, assets and commit provenance; transfer unique capabilities additively.

## 3. Baseline SHAs of the eight in-scope SOUL repositories

These are the GitHub `refs/heads/main` SHAs observed during Phase Zero. Re-query before any write; do not assume these SHAs remain current.

| Repository | Branch | Baseline SHA |
|---|---|---|
| `divibisoul/aeternum-core-29` | main | `d5932bbe9e91127d497e86acd32bbb305e0c14d6` |
| `divibisoul/Orquestrador-` | main | `5fd4e95d4e2bffb7fd1028da00cdbf7b4f66e49a` |
| `divibisoul/SARA` | main | `5633cdd95a067c1c40a4b731a38976971e173d1f` |
| `divibisoul/nexus-aeternum-fusion` | main | `676c20cb5e537944a5a75d8e4920ff48c010cfbf` |
| `divibisoul/Eternium-` | main | `0516bfcffa266190910c36389c75df642e13da41` |
| `divibisoul/nextjs-ai-chatbot` | main | `64e1b8719068b153130bcdbcfbbc2c78c11e1b8c` |
| `divibisoul/nextjs-ai-chatbots` | main | `b3ca469c8063c143081ad44fbeb7c238153a60cd` |
| `divibisoul/nextjs-ai-chatbot-2000` | main | `30847a58d7d94eee0890d9a7a03898d1f7e280aa` |

## 4. Critical policy notes

1. `Orquestrador-` declares GPL-3.0 in GitHub repository metadata. Linking it to a separately deployed service is safer than copying its code into a differently licensed distribution; confirm obligations with a license review.
2. Several SOUL repositories have no recognized repository-level license in GitHub metadata. Treat their code as rights-restricted until a license is explicitly confirmed; do not infer MIT from the use of open-source dependencies.
3. No external candidate is merged into the SOUL by virtue of being listed here. Every external integration requires a frozen SHA, license check, isolated adapter, contract tests and measured baseline.
4. No source files or dependencies are authorized for deletion by this file.
5. No N02 work begins until the overall DoD is backed by verified evidence and the relevant sinergy comparison is recorded.
