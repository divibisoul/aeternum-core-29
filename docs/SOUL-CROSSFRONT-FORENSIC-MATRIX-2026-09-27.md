# SOUL — Matriz Forense Transversal de Infraestrutura — 2026-09-27

## Objetivo
Organizar as frentes concorrentes sem substituir seus históricos. Separar identidade, ownership, implementação, integração, validação e comissionamento online.

## Regra de conservação
Nenhum componente, módulo, branch ou PR histórico é removido por esta auditoria. Duplicação é reconciliada por autoridade canônica, adapter ou compatibilidade.

## Identidade atual
SOUL é um sistema federado de sete núcleos independentes N01–N07, uma autoridade transversal SARA e camadas auxiliares. O Mesh é único. N07 é o plano de orquestração/federação/SuperGPU; SARA é a autoridade regenerativa/auditiva/ética.

### Não confundir
| Camada | Identidade | Autoridade |
|---|---|---|
| Soul Mesh | transporte/interoperabilidade | ownership nativo por núcleo |
| VagusNerveBus | control plane in-process de SARA/ERU | SARA |
| SuperGPU | runtime de computação de software existente | N07 |
| Octacore | processador de sistema G0–G7 | N07; reutiliza SuperGPU |
| SARA | ARA/ETR/ITR, regeneração, auditoria, ética, memória, rollback, governança | SARA |
| Clareira | runtime neural bio-inspirado | N01 |
| HortaCore/Chimera | composição meta | SARA/Aeternum |
| Aeternum M1–M8 | arquitetura modular de composição | N01 + N03/N05/N06 + SARA conforme contrato |
| Jev | serviço externo condicional | externo |
| LangGraph / NeMo | frameworks/capacidades auxiliares | N07, sem autoridade SARA |

## N01–N07 + SARA
| Slot | Núcleo | Repositório | HEAD observado em 2026-09-27 | Estado |
|---|---|---|---|---|
| G0 | SARA | divibisoul/SARA | 8d290a2d... | AUTHORITY / runtime presente |
| G1 | N01 | divibisoul/aeternum-core-29 | 462fc7d4... | OBSERVED; Clareira bridge em PR #37 |
| G2 | N02 | divibisoul/Eternium- | 993ad528... | VALIDATED no ledger atual |
| G3 | N03 | divibisoul/nexus-aeternum-fusion | 726a0f88... | MERGED; revalidação independente pendente |
| G4 | N04 | divibisoul/nextjs-ai-chatbots | 8c457291... | VALIDATED |
| G5 | N05 | divibisoul/nextjs-ai-chatbot | a405dd02... | VALIDATED |
| G6 | N06 | divibisoul/nextjs-ai-chatbot-2000 | 5c11eaf3... | VALIDATED |
| G7 | N07 | divibisoul/Orquestrador- | 4f258cde... | VALIDATED no ledger; staging/online dependente de ambiente |

Os hashes acima são checkpoints observados; qualquer atualização posterior exige nova leitura do HEAD antes de integração.

## Clareira
Clareira é nativa de N01. O ProjetoClareira existente possui ProcessingNode, HomeostasisManager, NucleoRaizAlma e InformationChannel.

PR #37 adiciona ClareiraPacket, ClareiraBridge, eventos no EventBus e ingresso Mesh. Ela ainda está em PR. Não deve ser declarada ONLINE ou MERGED.

Ponto forense encontrado no PR #37: o novo injectPacket() usa seleção aleatória quando destinationHint não resolve. Na fronteira federada, o comportamento correto deve ser determinístico: destino válido ou erro explícito. O método histórico de estímulo aleatório pode permanecer isolado para compatibilidade, mas não deve ser usado como mecanismo de roteamento federado.

runSimulation() é uma função histórica de atividade/simulação e não pode ser usada como evidência de produção.

## N07 SuperGPU
N07 já possui um runtime SuperGPU real em software, com leases, execução e paralelismo. Isso não significa hardware GPU físico.

Na auditoria foram encontrados defaults perigosos de operation que caiam silenciosamente em identity em caminhos SuperGPU e no pipeline cognitivo. A frente de reconciliação troca esses defaults por erro explícito, preservando o restante do processamento.

## Octacore
A implementação anterior de Octacore estava em branches defasadas em relação ao main atual. Portanto não é candidata automática a merge.

A definição correta é processador de sistema sobre G0–G7. G7 deve reutilizar o SuperGPU já existente em N07; não criar um segundo runtime de compute.

## SARA
SARA atual contém ARA/ETR/ITR e suas extensões, Trinity/ERU, RegenerativeLoop/SistemaVivo, Provenance, memória, rollback/SafeSandbox, GovernedSARA/LegalAI/Umbuntu/Buen Vivir, DecisionTrace/StormMonitor, QuantumCrawler/QuantumScanner, AeternumChimeraBridge, Omega e módulos de pesquisa/integração.

AeternumChimeraBridge está implementado e compõe GovernedSARA + ERU_Engine + QuantumCrawler. A própria bridge mantém quantum_compute_status como BLOCKED_INFRASTRUCTURE quando não existe backend verificado. Isso é uma fronteira real, não simulação.

## VagusBus
VagusNerveBus é um barramento in-process assíncrono. Ele não deve ser duplicado como segundo control plane.

Foi encontrada uma segunda fronteira de construção: ERURuntime instancia VagusNerveBus diretamente no seu construtor. Como ERURuntime não aparece no bootstrap principal atual, não é correto afirmar que duas instâncias coexistem no startup sem uma rota de instanciação observada. A correção feita nesta auditoria adiciona injeção opcional do bus, preservando a construção legada.

## Aeternum M1–M8
PR #33 descreve M1 Core/N01; M2 Orquestração/N01; M3 Linguagem/N05 via Mesh; M4 Mind/N06; M5 Percepção/N03; M6 Imunidade/SARA; M7 Evolução/SARA; M8 Governança+Memória/SARA.

M1–M8 é uma camada de composição funcional distinta dos slots Octacore G0–G7. Não se deve mapear uma estrutura na outra automaticamente.

## Frentes concorrentes N01
- PR #25 consolidação N01 — preservada.
- PR #27 ERU↔SOUL↔SARA — preservada.
- PR #29 Soul Admin Plus — preservada.
- PR #30 contrato híbrido Web/App — preservada.
- PR #31/#32 propostas Octacore G1 — preservadas, branches não são main.
- PR #33 Aeternum M1–M8 — preservada.
- PR #34 exposição SARA/Octacore — preservada.
- PR #35 gateway N01 context-aware — preservada.
- PR #36 reconciliação forense Clareira/N01 — preservada.
- PR #37 Clareira canônica/EventBus — baseada no main atual; exige revisão determinística antes de merge.
- PR #38 Core Aeternum — está baseado em uma linha de Fase 1 e não deve ser tratado como main-based sem reconciliação de ancestralidade.

## Evidência
OBSERVED = código/documentação encontrados. IN_PR = mudança em PR não merged. VALIDATED = checks reais associados à revisão. BLOCKED = falta infraestrutura/evidência. ONLINE = tráfego real com resposta correlacionada.

Na execução atual do N07, o job integrity chegou a SUCCESS com passos observáveis; o verify estava separado e ainda precisava concluir. Isso mostra que o problema histórico de runner não deve mais ser aplicado cegamente a todo o projeto.

No N01, execuções recentes ainda encerram cedo sem jobs persistidos; isso não demonstra falha funcional no código.

## Padrões externos usados como referência
A propagação de contexto deve manter o correlationId atual e pode ganhar compatibilidade aditiva com W3C traceparent/tracestate. W3C define headers padronizados para propagação de contexto entre serviços, e OpenTelemetry usa W3C Trace Context como propagador padrão. citeturn760829search0turn760829search6

Para concorrência, go test -race é uma ferramenta apropriada para detectar data races nos caminhos realmente exercitados; a documentação Go observa que o detector só encontra races em caminhos executados. citeturn760829search2

Para endpoints configuráveis, destinos confiáveis/allowlist devem ser preferidos quando aplicável, porque URLs arbitrárias podem criar SSRF. citeturn760829search3

## Regra de continuidade
Antes de modificar qualquer frente que esteja recebendo novos repositórios, atualizar primeiro o inventário de HEAD/PR/ancestralidade e abrir branch de reconciliação. Não editar diretamente uma branch concorrente sem autorização explícita.
