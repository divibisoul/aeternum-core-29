# SOUL — Crossfront State Before Final N07 Fusion

## Current repositories

| Nucleus | Repository | Mesh protocol | Contract | N07 visibility | Current note |
|---|---|---|---|---|---|
| N01 | aeternum-core-29 | soul-mesh/1 | 1.1.0 | typed envelope and peer client include N07 | registry/gateway owner; existing secure peer client preserved |
| N02 | Eternium- | soul-mesh/1 | 1.1.0 | peer list includes N07 | inference/cognitive runtime; resilient N01/N02 gateway hardening is on `upgrade/n01-n02-mesh-integration-v1` |
| N03 | nexus-aeternum-fusion | soul-mesh/1 | 1.1.0 | peer list includes N07 | audio/speech runtime |
| N04 | nextjs-ai-chatbots | soul-mesh/1 | 1.1.0 | nucleus union includes N07 | document/tool runtime |
| N05 | nextjs-ai-chatbot | soul-mesh/1 | 1.1.0 | type system includes N07 | conversational runtime |
| N06 | nextjs-ai-chatbot-2000 | soul-mesh/1 | 1.1.0 | peer list includes N07 | pilot/tools/cognitive runtime |
| N07 | Orquestrador- | soul-mesh/1 | 1.1.0 | active federation/control plane | orchestration, neural federation, correlation and SuperGPU layer |

## Compatibility state

The canonical production contract is **1.1.0**. N07 now contains an adaptive compatibility capability that can recognize legacy 1.2.0 input and normalize it into the canonical 1.1.0 envelope without replacing the secured Mesh runtime. N02 also accepts legacy action-style envelopes through its existing `api/soul-mesh.ts` handler while preserving authentication, replay protection and capability validation.

## Neural integration state

N02–N06 contain local `SynapticNodeBridge` modules over the existing Soul Mesh. N01 retains its existing production peer client rather than receiving a duplicate client. These bridges are repository-level integration capabilities; live seven-runtime connectivity still requires authenticated deployed endpoints.

## Integrity verification

All seven nuclei now contain a repository-local Soul Mesh integrity verifier. The verifiers check configured peers using `mesh.ping`, `mesh.health` and `mesh.describe`, validate protocol/contract/source/target/correlation identity, record latency and emit a machine-readable health report. They never turn an unconfigured external runtime into a false green result.

## N07 governance automation

N07 owns `scripts/generate-crossfront-state.mjs` and `.github/workflows/crossfront-state-sync.yml`. The workflow checks out the seven public repositories, reads their Mesh/configuration evidence, generates `SOUL-SYSTEM-CROSSFRONT-STATE.md`, and publishes only when generated content changes.

## Fusion invariants

- One canonical envelope after compatibility normalization.
- One correlation chain from ingress to egress.
- One owner per executable capability.
- N06 authentication/user ownership remains intact for contextual tools.
- N01 remains the discovery/registry boundary unless the final architecture explicitly changes that ownership.
- N07 orchestrates but does not copy specialized runtimes into itself.
- Existing transports remain truthful; test-only transports are not advertised as production capabilities.
- Final E2E acceptance requires actual authenticated traffic, not static endpoint/file checks.

## Current acceptance boundary

Repository-level capabilities are now instrumented, but the system must not be declared ONLINE until the existing N07 commissioning gates prove authenticated real traffic across the deployed runtime set and all required CI/E2E gates are green.

## SARA federation state

SARA é um serviço externo/complementar ao conjunto de núcleos SOUL; não foi reclassificado como N01–N07. O contrato federado atual é `SOUL↔SARA 1.0.0` e preserva a propriedade das capacidades: SARA é autoridade das operações `sara.health`, `sara.capabilities`, `sara.state`, `sara.cycle`, `sara.audit`, `sara.regenerate` e `sara.trace`.

Afinidades funcionais sem transferência de ownership:

| Núcleo | Uso complementar do SARA |
|---|---|
| N01 | gateway/host, estado, capacidades, saúde, rastreabilidade e ciclo |
| N02 | auditoria, ciclo, regeneração e traço como enriquecimento conversacional |
| N03 | auditoria/regeneração de conteúdo multimodal/textual produzido; traço |
| N04 | governança de documentos, ferramentas e artefatos via auditoria/regeneração/traço |
| N05 | apoio ao despacho/orquestração via ciclo, auditoria, regeneração e traço |
| N06 | cognição/auditoria/governança via auditoria, estado, traço, regeneração e ciclo |

A conexão é comprovada somente por descoberta/contrato, configuração, requisição real, resposta válida e correlação. Afinidade documental não é prova de conectividade.
