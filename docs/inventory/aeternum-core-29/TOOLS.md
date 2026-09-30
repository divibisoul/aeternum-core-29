# FASE 0 — N01 TOOLS / CAPABILITIES INVENTORY

Repository: divibisoul/aeternum-core-29
MAIN observado: 99fb9d22ddea3439c8b5be396ccae9e11ae3f66e

## B1. Identidade
Domínio primário: runtime/mesh do N01 e superfície Aeternum/Clareira.
Domínios secundários: neural, homeostase, memória HortaCore, AGI, SuperGPU, Android/WebView, capability registry.
Papel octacore: nó de processamento próprio + gateway Mesh + expansor das capacidades nativas dos demais núcleos.

## B2. Processadores internos
| Processador/engine | Path | Responsabilidade | Estado |
|---|---|---|---|
| ProjetoClareira | src/core/neural/ProjetoClareira.ts | 9 nós neurais + canais | ativo |
| ProcessingNode | src/core/neural/ProcessingNode.ts | processamento local | ativo |
| NucleoRaizAlma | src/core/neural/NucleoRaizAlma.ts | decisão central Clareira | ativo |
| HomeostasisManager | src/core/neural/HomeostasisManager.ts | regulação | ativo / legado sintético parcial |
| PrecisionEngine | src/core/PrecisionEngine.ts | pipeline de precisão/interceptação | ativo |
| SelfLoop | src/core/SelfLoop.ts | aprendizagem/atividade | ativo |
| AeternumAGI | src/core/agi/index.ts | composição AGI | ativo |
| NeuralManagementCore | src/core/agi/NeuralManagementCore.ts | gestão neural | reintegrado no MAIN |
| SoulMeshRouter | src/core/mesh/SoulMeshRouter.ts | request/response/event Mesh | ativo |
| SoulMeshHttpTransport | src/core/mesh/SoulMeshHttpTransport.ts | HTTP + HMAC/retry/circuit | ativo |
| HortaCore | src/core/hortaCore.ts | estado em memória + changelog | ativo; não é disco |

## B3. Endpoints
| Método | Path | Estado | Observação |
|---|---|---|---|
| GET | /mesh/health | BLOCKED_ENV/LIVE conforme runtime | servidor local Mesh real |
| GET | /mesh/discovery | BLOCKED_ENV/LIVE conforme runtime | peers configurados por env |
| GET | /mesh/fusion | BLOCKED_ENV/LIVE conforme runtime | snapshot de fusão |
| POST | /api/soul-intake | BLOCKED_ENV | Gemini depende de GEMINI_API_KEY |
| POST | /mesh/register | LIVE quando servidor executando | registro de peer |
| POST | /mesh/heartbeat | LIVE quando servidor executando + token de registro | heartbeat |
| POST | /api/soul-mesh | LIVE quando servidor executando | ingress soul-mesh/1 |
| POST | /mesh/in,/mesh/out | LIVE quando servidor executando | transporte Mesh |

Não marcar endpoint HTTP como LIVE VERIFICADO apenas pela existência do handler: exige processo real + URL + transação.

## B4. Funções públicas principais
| Módulo | Função | Assinatura resumida | Consumidores |
|---|---|---|---|
| EventBus | on | on<K>(event, callback): unsubscribe | core/neural/mesh |
| EventBus | emit | emit<K>(event, data): Promise<void> | core inteiro |
| EventBus | listenerCount | listenerCount<K>(event): number | diagnósticos |
| ModuleRegistry | register | register(ModuleDefinition): void | app/modules |
| ModuleRegistry | initialize | initialize(): Promise<void> | App |
| ProjetoClareira | injectStimulus | injectStimulus(data, criticality?, target?): boolean | UI/core |
| ProjetoClareira | injectPacket | injectPacket(packet): boolean | ClareiraBridge |
| ProjetoClareira | getStatus | getStatus(): object | observabilidade |
| HortaCore | set/get | set/get(key,value) | core/bridges |
| SoulMeshRouter | request | request(target, capability, payload): Promise<Message> | Mesh clients |

## B5. Eventos emitidos
| Evento | Payload | Consumidores |
|---|---|---|
| system:init | timestamp | core |
| system:ready | modules[] | App/diagnóstico |
| clareira.packet.ingested | correlationId/sourceId | Clareira consumers |
| clareira.packet.dropped | correlationId/reason | Clareira consumers |
| clareira.degraded | reason | observabilidade |
| soul:mesh:message | SoulMeshMessage | Mesh/core |
| module:* | id/name/error | ModuleRegistry/UI |

## B6. Eventos escutados
EventBus.on é usado por ModuleRegistry, SelfLoop, MeshRouter e bridges. HortaCoreContinuityBridge escuta o EventBus e o health registry do runtime de fusão. Não existe um segundo EventBus canônico.

## B7. Dependências externas
Supabase Realtime/Storage quando configurado; Gemini para inferência BYOK; Web3/IPFS em caminhos configurados; ambiente Android/WebView e respectivos APIs no subprojeto mobile.

## B8. Dependências inter-núcleo
N01 usa Soul Mesh HTTP/Realtime, com URLs/tokens/HMAC por ambiente. Peer client suporta N02–N07. N01 também possui fronteira SARA externa via HTTP. Clareira pode ser encaminhada pelos peers para N01.

## B9. Ferramentas adormecidas
| Ferramenta | Precisa de | Estado |
|---|---|---|
| Gemini inference | GEMINI_API_KEY | BLOCKED_ENV quando ausente |
| peers Mesh | URLs/tokens/HMAC | BLOCKED_ENV |
| SARA federation | SARA URL/token | BLOCKED_ENV |
| wearable GEM-Health | fonte wearable real | PENDING / NÃO MEDIDO |
| RGO Trinity/Horta | PRs #60/#54 + serviços reais | BRANCH_ONLY |

## B10. Executáveis locais
ProjetoClareira, EventBus, ModuleRegistry, HortaCore, SoulMeshRouter e processamento neural local são executáveis no código; evidência de execução de runtime desta auditoria não foi medida fora dos artefatos CI já registrados historicamente.

## B11. Expansão por conexão
| Ao conectar | Ganha | Perde | Neutro |
|---|---|---|---|
| N07 | orchestration/compute/policy | nenhuma autoridade nativa | N01 ownership |
| N02 | conversa/LLM rápido | nenhuma autoridade | Mesh |
| N03 | áudio/percepção/fusão | nenhuma autoridade | Mesh |
| N04 | tools/docs/artifacts | nenhuma autoridade | Mesh |
| N05 | inference/conversation dispatch | nenhuma autoridade | Mesh |
| N06 | sessão/contexto/cognitive tools | nenhuma autoridade | Mesh |
| SARA | regeneração/governança | nenhuma autoridade do Mesh | HortaCore local |
