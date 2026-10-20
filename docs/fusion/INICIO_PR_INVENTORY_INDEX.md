# SOUL Fusion — Início: inventário de PRs abertas e mapa de similaridade

**Snapshot:** 2026-10-20 (timestamps individuais em UTC).  
**Escopo:** somente leitura de estado e criação de documentação de inventário nesta branch. Nenhum código, workflow de produto, dependência ou PR original foi editado, mesclado, fechado ou rebaseado.

## 1. Núcleos/repositórios detectados

| Ordem | Núcleo atribuído | Repositório público | PRs abertas | Papel-base |
|---:|---|---|---:|---|
| 1 | N01 | [`divibisoul/aeternum-core-29`](https://github.com/divibisoul/aeternum-core-29) | 42 | Mesh/coordenação, HortaCore e gateway |
| 2 | N02 | [`divibisoul/Eternium-`](https://github.com/divibisoul/Eternium-) | 32 | runtime de capacidades/agentes, providers e inferência |
| 3 | N03 | [`divibisoul/nexus-aeternum-fusion`](https://github.com/divibisoul/nexus-aeternum-fusion) | 24 | áudio, fala e multimodalidade |
| 4 | N04 | [`divibisoul/nextjs-ai-chatbots`](https://github.com/divibisoul/nextjs-ai-chatbots) | 26 | ferramentas/documentos e frontend derivado |
| 5 | N05 | [`divibisoul/nextjs-ai-chatbot`](https://github.com/divibisoul/nextjs-ai-chatbot) | 23 | chat, retrieval e providers |
| 6 | N06 | [`divibisoul/nextjs-ai-chatbot-2000`](https://github.com/divibisoul/nextjs-ai-chatbot-2000) | 20 | cognição e runtime de agentes |
| 7 | N07 | [`divibisoul/Orquestrador-`](https://github.com/divibisoul/Orquestrador-) | 100 | plano de controle/orquestração |
| 8 | SARA / G0 | [`divibisoul/SARA`](https://github.com/divibisoul/SARA) | 22 | ciclo regenerativo e governança ética; designação N08 apenas provisória |
| 9 | JEV / N09 | [`divibisoul/jev-api`](https://github.com/divibisoul/jev-api) | 2 | decisão, triagem e guardrails; designação N09 provisória |

**Total do snapshot:** 291 PRs abertas, incluindo drafts. N08/SARA e N09/JEV são atribuições provisórias; a nomenclatura deve ser confrontada com a fonte canônica dos núcleos. Os três repositórios Next.js estão mapeados como N04/N05/N06 para fins de inventário, sem declarar ainda qual deve ser preservado como UI canônica.

## 2. Regras de interpretação do inventário

- Ordenar cada inventário por `created_at` crescente (mais antiga → mais recente).
- Guardar número/título, data UTC, branch head/base, estado draft/ready, SHA head/base, paths e contagens de alteração.
- Quando a base de uma PR é a branch head de outra PR aberta no mesmo repositório, registrar dependência empilhada explícita. Quando a descrição aponta uma PR por URL/número, registrar a referência como dependência declarada; menções ambíguas são marcadas para revisão.
- Resumo, capacidades e temas são classificados a partir de título, body e arquivos alterados. Não constituem aprovação sem análise do diff e dos testes.
- PRs abertas não são todas independentes. Uma PR de correção sobre outra base não deve ser aplicada isoladamente nem rebaseada antes de entender a pilha.
- O levantamento é um snapshot; qualquer PR criada/fechada durante a análise exige atualização antes de iniciar fusão.

## 3. Taxonomia da matriz de similaridade funcional

| Código | Tema | Sinais típicos |
|---|---|---|
| T01 | CI, env, dependências, submodules | workflows, gates, lockfiles, variáveis, pins |
| T02 | Mesh HTTP/listener/transport | servidor, gateway, health endpoints, ingress/egress |
| T03 | Discovery, registry, ownership | discovery, capability registry, route resolution, channel topology |
| T04 | HMAC e segurança | assinatura, autenticação, replay, secrets, fail-closed |
| T05 | Correlation, trace, retries, idempotência | correlation IDs, trace IDs, timeouts, retries, deduplicação |
| T06 | Resiliência, forense, recuperação | forensic/recovery, circuit breaker, lifecycle, rollback |
| T07 | Capability fabric e fontes externas | SOUL-25, adapters de agentes, external sources, provider routing |
| T08 | Gemini/Groq/LLM inference | providers, inferência, prompt/streaming, SDKs |
| T09 | Storage, memória e proveniência | Supabase, IPFS/Storacha, vector memory, persistence |
| T10 | SARA/Clareira/Vagus/ERU/RGO | ciclo regenerativo, governança, sinais e contratos transversais |
| T11 | Octacore/coordenação/SuperGPU | orquestração, admission, leases, processors, parallel execution |
| T12 | Frontend/UI/docs | telas, dashboard, context/chat UX, documentação |
| T13 | Android/mobile/device | APK, instrumentation, bridges nativos, wearable |
| T14 | E2E, smoke, regressão e contratos | integration tests, process-pair E2E, fixtures e assertions |
| T15 | Neural/telemetria/recursos | parâmetros, NeuralManagementCore, model math, métricas |
| T16 | Estado, contexto e observabilidade | state sync, memory/context propagation, logs, audit trail |

A matriz completa terá uma linha por PR aberta. PRs com interseções semelhantes serão agrupadas por bloco funcional antes de qualquer merge; o número de PRs num grupo não é razão suficiente para mesclar sem revisar sobreposição e dependência.

## 4. Ordem de fusão prevista (7 camadas)

| Camada | Nome | Conteúdo/critério de entrada |
|---:|---|---|
| 0 | Fundação | CI, env templates, pins/submodules, base estrutural; nenhuma mudança destrutiva |
| 1 | Mesh core | listener/health/discovery/register, HMAC, correlation, canais e compatibilidade |
| 2 | Runtime | capability registry, execução de agentes, bridge e adapters internos |
| 3 | Resiliência | forensic/recovery, idempotência, timeout, lifecycle e falhas |
| 4 | Integrações externas | SARA/Clareira, Gemini/Groq, storage híbrido, SOUL-25, vLLM/SGLang e proveniência |
| 5 | Orquestração | Octacore, SuperGPU, agentes, adapters de capacidade e L5 monitor |
| 6 | Frontend + docs + E2E | interface, documentação, regressão, smoke e validação cruzada entre núcleos |

## 5. Branches de fusão propostas (ainda não criadas)

Padrão de branch com data de início proposta `2026-10-20`:
- `fusion/n01-unified-2026-10-20` — aeternum-core-29
- `fusion/n02-unified-2026-10-20` — Eternium-
- `fusion/n03-unified-2026-10-20` — nexus-aeternum-fusion
- `fusion/n04-unified-2026-10-20` — nextjs-ai-chatbots
- `fusion/n05-unified-2026-10-20` — nextjs-ai-chatbot
- `fusion/n06-unified-2026-10-20` — nextjs-ai-chatbot-2000
- `fusion/n07-unified-2026-10-20` — Orquestrador-
- `fusion/sarag0-unified-2026-10-20` — SARA
- `fusion/jevn09-unified-2026-10-20` — jev-api

Estas são propostas para o MEIO, não branches de integração já criadas. O inventário atual reside em `inventory/soul-open-prs-2026-10-20`, que é somente uma branch de relatório.

## 6. PROGRESS TRACKER — estado de início

| Indicador | Valor inicial |
|---|---:|
| Total de núcleos/repositórios inventariados | 9 |
| Total de PRs abertas no snapshot | 291 |
| PRs integradas | 0 / 291 |
| Camadas concluídas | 0 / 7 |
| PRs fechadas | 0 |
| PRs originais alteradas/rebaseadas | 0 |
| Arquivos de código modificados neste passo | 0 |
| Relatórios de PR por repositório | **CONCLUÍDOS** — 25 lotes com fichas e matriz local |
| Estado | **INÍCIO — somente inventário** |

**Gate:** não iniciar o MEIO/N01 até o inventário por PR, a matriz de similaridade e a base de rollback serem revisados. O tracker começa em zero porque nenhuma PR foi integrada por esta atividade.


## 7. Inventários detalhados — PRs abertas por núcleo

Os documentos abaixo foram gerados lendo a lista aberta por repositório e consultando os arquivos alterados de cada PR. Cada linha registra datas UTC, título, branch head/base, draft/ready, resumo da descrição, paths/statísticas, dependências/base empilhada, capacidades/adapters identificados e tags T01–T16.

- **N01 (42 PRs):** [001–014](inventory/N01-001-014.md) · [015–028](inventory/N01-015-028.md) · [029–042](inventory/N01-029-042.md)
- **N02 (32 PRs):** [001–014](inventory/N02-001-014.md) · [015–028](inventory/N02-015-028.md) · [029–032](inventory/N02-029-032.md)
- **N03 (24 PRs):** [001–014](inventory/N03-001-014.md) · [015–024](inventory/N03-015-024.md)
- **N04 (26 PRs):** [001–014](inventory/N04-001-014.md) · [015–026](inventory/N04-015-026.md)
- **N05 (23 PRs):** [001–014](inventory/N05-001-014.md) · [015–023](inventory/N05-015-023.md)
- **N06 (20 PRs):** [001–014](inventory/N06-001-014.md) · [015–020](inventory/N06-015-020.md)
- **N07 (100 PRs):** [001–014](inventory/N07-001-014.md) · [015–028](inventory/N07-015-028.md) · [029–042](inventory/N07-029-042.md) · [043–056](inventory/N07-043-056.md) · [057–070](inventory/N07-057-070.md) · [071–084](inventory/N07-071-084.md) · [085–098](inventory/N07-085-098.md) · [099–100](inventory/N07-099-100.md)
- **SARA/G0 (22 PRs; N08 provisório):** [001–014](inventory/SARA%20/%20G0-001-014.md) · [015–022](inventory/SARA%20/%20G0-015-022.md)
- **JEV/N09 (2 PRs; N09 provisório):** [001–002](inventory/JEV%20/%20N09-001-002.md)

## 8. Matriz de similaridade funcional — global

- [Matriz global consolidada — 291 PRs](MATRIZ_SIMILARIDADE_GLOBAL.md)
- [Parte 1 — N01–N03](matrix-parts/PART-01-N01-N03.md)
- [Parte 2 — N04–N06](matrix-parts/PART-02-N04-N06.md)
- [Parte 3 — N07](matrix-parts/PART-03-N07.md)
- [Parte 4 — SARA/G0 e JEV/N09](matrix-parts/PART-04-SARA-JEV.md)

A matriz usa `●` como indício encontrado no título/body/paths e `·` como “não detectado por regra de triagem”, nunca prova de ausência. As tags agrupam candidatos por função; a decisão de fusão exige revisão de diffs, símbolos, contratos e testes, e deve respeitar a cadeia de bases empilhadas.

## 9. Estado do INÍCIO

**INÍCIO concluído para revisão:** 9 repositórios/núcleos lógicos mapeados, 291 PRs abertas inventariadas em ordem cronológica por repositório, 291 linhas reunidas na matriz global, 7 camadas propostas e tracker ainda zerado.

Nenhuma PR foi integrada, fechada, rebaseada ou alterada. Nenhum arquivo de código foi modificado. Nenhuma branch de fusão por núcleo foi criada. A única branch criada para esta fase é a branch documental `inventory/soul-open-prs-2026-10-20`.

**Aguarda-se confirmação humana para iniciar o MEIO em N01.**
