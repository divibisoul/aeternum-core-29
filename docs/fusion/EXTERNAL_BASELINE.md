# External Candidate Baseline — SOUL Fusion

> **Purpose:** reproducible inventory of external candidates before integration.
>
> **Captured:** 2026-10-19 local date; refs and repository metadata were read from GitHub API. A SHA is immutable; branch names are not.
>
> **Status:** inventory only. No external source was copied or merged. Do not treat this file as license approval or evidence of compatibility. Every runtime adapter must pin the listed SHA and independently validate the exact package/license/model artifact it uses.

## 1. Frozen repository refs and license decision

| Group | Repository | Branch | SHA | GitHub repo-level license metadata | Current integration decision |
|---|---|---|---|---|---|
| A | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | main | `1400d25b7b88cfa055c55b8a82bd95b7c25caef1` | MIT | Code incorporation permitted subject to notices/dependency audit; use as isolated runtime adapter. |
| A | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | main | `c6e500ab3730ccf3badb640c6e0170e5c6aa3882` | MIT | Code incorporation permitted subject to notices/dependency audit; optional specialized-task adapter. |
| A | [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) | main | `11cdf466d042aece04fc6cfd13b28e1a70341b1f` | MIT | Code permitted under MIT, but pin old active snapshot and run dependency/security audit before adoption. |
| A | [microsoft/autogen](https://github.com/microsoft/autogen) | main | `004749e6b7102c8fd317b9b1499ce5807223c278` | CC-BY-4.0 at repository metadata | **Component-specific:** Python code packages declare MIT in `LICENSE-CODE`; repo also has CC-BY-4.0 material. Copy only verified code components and preserve notices; project says archived/no longer maintained. Prefer API/adapter or legacy-only reuse. |
| B | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | main | `8d39305538c1d17a30cbe477e57a0e18fcee7d95` | MIT | Code incorporation is possible under MIT; use isolated service/SDK boundary, not broad source copy. |
| B reference | [TransformerOptimus/SuperAGI](https://github.com/TransformerOptimus/SuperAGI) | main | `c3c1982e7bd6a11cfed53c5a193ea502f924b1b6` | MIT | Reference only for this plan; dependency set is old and default branch has had no push since 2025-01-22. |
| F | [huggingface/transformers](https://github.com/huggingface/transformers) | main | `6f2e80bdad560947903bb4bde8043ae95387069a` | Apache-2.0 | Code incorporation possible with notices; each model/checkpoint/weights has separate license and revision. |
| F | [pytorch/pytorch](https://github.com/pytorch/pytorch) | main | `a84b7baa33f893ab92176c08a85b14455e60b2fc` | NOASSERTION | **Do not copy repository wholesale.** Project lists a BSD-3-Clause primary license and many third-party licenses; consume a pinned distribution and audit SBOM/notices for selected build. |
| F | [keras-team/keras](https://github.com/keras-team/keras) | master | `1344327802186002d058527b979089ebe002fa47` | Apache-2.0 | Optional abstraction in its own environment; no shared install with all frameworks by default. |
| F | [tensorflow/tensorflow](https://github.com/tensorflow/tensorflow) | master | `0794c6d5cdd392b60f788c8dd2fc4b7cf0262db9` | Apache-2.0 | Separate environment only when a selected model needs TensorFlow. |
| F | [jax-ml/jax](https://github.com/jax-ml/jax) | main | `4560f608edcf0dc56e242f4d0c56c90368dad291` | Apache-2.0 | Separate environment only when a selected model/workload needs JAX and a compatible accelerator/runtime. |
| G | [PrefectHQ/prefect](https://github.com/PrefectHQ/prefect) | main | `817bc93b6e828459e6853fa8b51ddba52515ad16` | Apache-2.0 | Suitable to evaluate as task/workflow service; pin packages and verify license notices. |
| G | [redpanda-data/connect](https://github.com/redpanda-data/connect) | main | `b1ca5e63373948435f3560469c47fa72153aaa44` | no SPDX detected | **Copy blocked pending component-level legal review.** Repository includes distribution/bundle-specific terms; connect over its supported API/protocol if license terms permit the intended use. |
| G | [MarquezProject/marquez](https://github.com/MarquezProject/marquez) | main | `180f37b22387146187af1ef0279e3ee1d1ccd789` | Apache-2.0 | Suitable as separately deployed lineage service; confirm authentication is enabled before exposing metadata. |
| D | [Avaiga/taipy](https://github.com/Avaiga/taipy) | develop | `5bcb5749521f9ddcc725c009aca00a88ff724e87` | Apache-2.0 | Internal dashboard candidate only; isolate runtime and verify active release/branch. |
| C | [trueagi-io/hyperon-experimental](https://github.com/trueagi-io/hyperon-experimental) | main | `3f76dc460da6961f57f69f6c3e550c59c74ada83` | MIT | Experimental research adapter only; repo explicitly says pre-alpha. |
| C reference | [drussell23/JARVIS](https://github.com/drussell23/JARVIS) | main | `739adf9569b6407ccaff7cdfd93b3b42f4f3c787` | no SPDX detected | **Source-code copy blocked** until an explicit permissive license/authorization is verified. Architecture reference only; review current license terms before redistributing. |
| C research | [50RC3/vAIn](https://github.com/50RC3/vAIn) | root | `6c64ed3ee081809f311f0a7fdcdc7a2b3a5389b9` | no SPDX detected | Canonical repository identified, but **source-code copy blocked** until license is clarified. Low activity and mixed ML dependencies; inspect separately. |
| C | [OpenSource-Syndicate/RAVANA](https://github.com/OpenSource-Syndicate/RAVANA) | main | `c5d5095b2f918657b9261a6b958e2f4f013305cb` | MIT | Canonical repository identified. Possible experimental service/adaptor only after clean-install, tests, threat-model and maintenance review. |

## 2. Baseline freshness and maintenance signals

Recent repository pushes from the GitHub repository metadata snapshot:

- Current activity observed on 2026-10-19/20: LangGraph, CrewAI, OpenHands, Transformers, PyTorch, Keras, TensorFlow, JAX, Prefect, Redpanda Connect and JARVIS.
- Latest default-branch commit observed 2026-05-07: Taipy.
- Latest default-branch commit observed 2026-04-12: Marquez.
- Latest default-branch commit observed 2026-02-11: Hyperon.
- Latest default-branch commit observed 2026-01-21: MetaGPT.
- Latest default-branch commit observed 2025-01-22: SuperAGI.
- vAIn root branch: last commit observed 2025-05-07.
- RAVANA main: last commit observed 2025-12-08.

These signals are not security audits and do not prove defects. They are reasons to run a dependency, build, test and maintainer-health review before adopting the older candidates.

## 3. License gate

The GitHub repository metadata license field is a triage signal, not a substitute for reading the actual license files. The integration owner must record for every copied source component: path, source SHA, license text/SPDX, notices to preserve, modifications, destination path and transitive dependency/SBOM result. The same applies independently to pretrained weights, datasets, plugins and model APIs.

Repositories with no recognized permissive license in this snapshot (Redpanda Connect, JARVIS and vAIn) must not have source copied into SOUL until licensing is resolved. A separate service/API connection is not automatically license-free; the intended API use and terms still require review.

## 4. Go toolchain observation

The pinned `divibisoul/Orquestrador-` baseline declares `go 1.25` in `go.mod`. Go 1.25 is a real released Go version, so the literal is not invalid and no automatic edit was made under the instruction “if it does not exist, correct it.” The official Go release history lists Go 1.27.2 released 2026-10-08 as the current patch line for Go 1.27. Test a toolchain upgrade to Go 1.27.2 in an isolated branch before changing the module directive or CI; this document does not certify the code under that newer compiler.

## 5. Freeze rule

All rows refer to the exact branch ref and SHA observed in this capture. Before executing a build or writing an adapter, re-query the branch ref and confirm the selected SHA has not changed; then use the recorded SHA directly in CI/configuration. Any updated dependency SHA is a new baseline and requires a new comparison, license review and tests.
