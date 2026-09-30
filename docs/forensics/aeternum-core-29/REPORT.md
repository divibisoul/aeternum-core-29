# FASE 0 — N01 FORENSIC REPORT

Data: 2026-09-30
Repository: divibisoul/aeternum-core-29
Current MAIN observed: 99fb9d22ddea3439c8b5be396ccae9e11ae3f66e
Baseline Fase 1 / marco-zero Clareira: 462fc7d4fc95bdff3307649a3b0c9abd9cffe98d

## A1–A5 — lineage
O marco-zero é a base explícita da PR #37. O compare baseline→main anteriormente medido retornou 66 commits e 49 arquivos no intervalo, com 0 arquivos deletados e 0 renames. A árvore de tags não é mensurável pelo conector GitHub disponível.

MAIN avançou desde a auditoria anterior. O histórico atual mostra reintegração do NeuralManagementCore e da continuidade HortaCore. Isso corrige a classificação anterior de NeuralManagementCore: ele não deve mais ser tratado como somente branch-only; o commit atual de MAIN é evidência de reintegração no tronco.

## A6–A10 — deltas e frentes
Não existe equivalente completo de `git diff --stat` recursivo disponível neste conector para todas as refs, portanto commits individuais e comparações disponíveis são usados. Branches/referências relevantes: integrate/clareira-octapla-2026-09-25, feat/phase2-block1-core-reconciled-2026-09-27, feat/recovered-aeternum-mesh-capability-bridge-2026-09-29, feat/hortacore-vascular-mesh-integration, rgo-trinity-mmd-2026-09-29-final.

PRs #60 (RGO/Horta), #63 (recovered modules → Mesh), #65 (vascular Horta), #66 (Gemini semantic memory), #67 (real Horta test), #68 (GEM-Health truthful) permanecem abertos e não são considerados parte do MAIN só por existirem.

## Arquivos críticos
| Path | Baseline | MAIN | Classificação |
|---|---|---|---|
| src/core/EventBus.ts | sim | sim | OK |
| src/core/ModuleRegistry.ts | sim | sim | OK |
| src/core/neural/ProjetoClareira.ts | sim | sim | OK — 9 nós |
| src/core/neural/ProcessingNode.ts | sim | sim | OK |
| src/core/neural/HomeostasisManager.ts | sim | sim | OK estrutural / simulação legada |
| src/core/neural/InformationChannel.ts | sim | sim | OK |
| src/core/neural/types.ts | sim | sim | OK |
| src/core/neural/NucleoRaizAlma.ts | sim | sim | OK |
| src/core/PrecisionEngine.ts | sim | sim | OK |
| src/core/SelfLoop.ts | sim | sim | OK |
| src/core/mesh/SoulMeshRouter.ts | sim | sim | OK |
| src/core/hortaCore.ts | não | sim | NOVO — memória complementar |
| src/core/eventBus.ts | não | sim | NOVO — fachada delegadora |
| lib/aeternum/EventBus.ts | não | sim | NOVO/RECUPERADO — fachada sobre EventBus canônico |
| src/core/agi/NeuralManagementCore.ts | não | sim | NOVO/REINTEGRADO — MAIN atual |

## V1 EventBus
O EventBus canônico é `src/core/EventBus.ts`. Métodos observados: on, once, emit, off, clear, getLog, listenerCount. on/once devolvem funções de unsubscribe. `src/core/eventBus.ts` delega para esse singleton; não cria um segundo dispatch loop.

## V2 ModuleRegistry
`src/core/ModuleRegistry.ts` continua o registry canônico React. `wormholeRegistry` é uma camada de assinatura/capability e não deve absorver sua responsabilidade.

## V3 Clareira
ProjetoClareira mantém NC-001 + NP-001..003 + NS-001..005 = 9 nós. O caminho federado `injectPacket` e os eventos Clareira foram adicionados sem reduzir o conjunto.

## V4 neural/*
Constants críticas permanecem em `src/core/neural/types.ts`, incluindo HOMEOSTASIS_CHECK_INTERVAL=1000, MAX_QUEUE_SIZE=100 e REPORT_INTERVAL=2000; PacketType mantém 6 tipos. Homeostasis ainda contém `Math.random()` para recuperação probabilística. Isso é comportamento legado e não é evidência de deleção/soterramento.

## V5 mesh/rgo/core
SoulMeshRouter e transporte HTTP/HMAC continuam no MAIN. RGO Trinity/HortaCore das PRs #60 e #54 continua branch-only até merge ordenado.

## V6 App
App.tsx preserva ModuleRegistry, EventBus, ProjetoClareira e AeternumAGI; não há window.prompt/alert/confirm no escopo pesquisado.

## V7 config
package.json, tsconfig e Vite permanecem como base do app. go.mod não pertence ao runtime principal do N01.

## Simulação
Foram identificados no MAIN comportamentos sintéticos em GEMHealth (pré-#68), SelfHealingArchitecture, ResourceManager e alguns indicadores AGI. O PR #68 atualmente trabalha especificamente na fronteira GEM-Health, removendo leituras fisiológicas fabricadas quando o wearable não existe. Isso é uma frente corretiva ativa e deve ser integrada antes de novas expansões nessa área.

## Causalidade e restauração
Não há evidência atual de arquivo crítico deletado do marco-zero. O que foi “soterrado” em N01 aparece majoritariamente como componentes adicionados historicamente e posteriormente reintegrados em MAIN, especialmente NeuralManagementCore e continuidade HortaCore. O próximo risco real é duplicação de frentes abertas sobre o mesmo substrato, não ausência do arquivo canônico.

## Estado A
AUDITORIA FORENSE N01: FECHADA NO ESCOPO OBSERVÁVEL.
CI atual: NÃO MEDIDO pelo conector nesta sessão.
LIVE distribuído: NÃO VERIFICADO.
