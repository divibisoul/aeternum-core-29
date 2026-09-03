# N01 — Arquitetura Consolidada

## 1. Papel

N01 é o runtime de referência/coordenação do SISTEMA SOUL. Ele mantém runtime independente, preserva as capacidades nativas e oferece a fronteira comum do Soul Mesh para descoberta, transporte, correlação, integridade e delegação.

## 2. Autoridades canônicas

| Responsabilidade | Autoridade |
|---|---|
| Seleção de transporte | `lib/soul-mesh/HybridTransportRegistry.ts` através de `src/core/soul/CanonicalTransportAdapter.ts` |
| Envelope autenticado | `lib/soul-mesh/SoulMeshEnvelope.ts` |
| Contrato de mensagens moderno | `src/core/mesh/SoulMeshProtocol.ts` |
| Roteamento moderno | `src/core/mesh/SoulMeshRouter.ts` |
| Facade de compatibilidade do envelope | `src/core/soul/SoulMeshEnvelope.ts` |
| Grafo de capacidades nativas | `src/core/soul/CapabilityGraph.ts` |
| Exposição de capacidades no Mesh | `src/core/soul/N01CapabilityBridge.ts` |
| Estado/rotas neurais | `src/soul-fusion/SoulNeuralGraph.ts` |
| Camada executiva | `src/soul-fusion/NeoCortexPrefrontal.ts` |
| Gateway HTTP/Soul Mesh | `scripts/soul-mesh-server.mjs` |
| Watchdog Android | `SoulAdminService` + `SoulCortex` |

A facade `src/core/soul/SoulMeshEnvelope.ts` preserva o limite histórico de importação, mas delega assinatura e verificação à implementação canônica em `lib/soul-mesh/SoulMeshEnvelope.ts`. Não existem duas implementações criptográficas concorrentes.

## 3. Soul Mesh

O protocolo é `soul-mesh/1`, contrato `1.1.0`, com sete núcleos (`N01`…`N07`). Cada núcleo possui seis relações com os demais: 42 links direcionais e 21 pares bidirecionais.

Transportes registrados: `IN_PROCESS`, `WEBVIEW_BRIDGE`, `LOOPBACK_HTTP`, `HTTP` e `REALTIME`. A seleção é responsabilidade única do `HybridTransportRegistry`, exposta pelo `CanonicalTransportAdapter`.

## 4. Integridade e segurança

O envelope canônico valida versão, tipo, origem/destino, identificadores, timestamp, nonce e replay; quando configurado, o segredo HMAC-SHA256 autentica o conteúdo. A camada Android aplica a mesma versão de protocolo/contrato, limites de IDs/capacidade, rota entre núcleos e janela de timestamp.

Respostas remotas precisam preservar o `correlationId` da requisição e inverter corretamente origem/destino. Falhas repetidas alimentam circuit breaker temporário, sem desativar o runtime local.

## 5. Capacidades

`CapabilityGraph` é a fonte de verdade das capacidades nativas do N01. `N01CapabilityBridge` projeta esse catálogo para o contrato de Mesh e seu self-test detecta catálogo vazio, IDs duplicados ou implementação ausente.

## 6. Roteamento cognitivo

`SoulNeuralGraph` mantém nós, sinais e pesos aprendidos. `NeoCortexPrefrontal` combina metas, memória de trabalho, evidência, consenso e execução do SuperGPU. `fast_inference` é um sinal de prioridade de roteamento; a posse do provedor continua no núcleo que o implementa.

## 7. Gateway

O gateway N01 oferece saúde, descoberta, registro, heartbeat, resolução de capacidades, execução unificada, SuperGPU, delegação e entrada `soul-mesh/1`. Apenas N02–N07 são peers estruturais válidos.

## 8. Storage

O storage de artefatos híbridos usa conteúdo endereçado por CID no Web3 Storage/IPFS e registra metadados no Supabase. Essa função não substitui nem duplica a autoridade de vector-memory.

## 9. Sentinel

`SoulAdminService` executa como foreground service, observa integridade pelo `SoulCortex`, atualiza o estado operacional e agenda reinicialização limitada após falhas consecutivas do ciclo de watchdog. `SoulBootReceiver` religa o serviço após boot e substituição do pacote quando a configuração estiver habilitada; o padrão é habilitado.

## 10. Diagnóstico 5×5

`npm run mesh:diagnose` executa 25 verificações estruturais em cinco domínios: CORE, TRANSPORT, MESH, INTEGRITY e SENTINEL. O resultado estrutural nunca é apresentado como prova de que peers remotos estão online.

Os probes de runtime usam timeout cancelável, validam endpoints HTTP(S), versão do contrato e correlação exata.

## 11. Validação

A certificação real depende de execução. A sequência obrigatória é `npm ci`, `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`, build/testes Android e depois uma transação correlacionada N01↔N02. Evidência estrutural ou documentação não substitui execução.

## 12. Continuidade

A branch `consolidacao-n01` e a PR #25 permanecem a única linha canônica do N01. Alterações futuras devem partir do HEAD atual, preservar histórico e não criar uma terceira implementação para uma responsabilidade já existente.
