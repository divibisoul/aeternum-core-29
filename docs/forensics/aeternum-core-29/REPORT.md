# FASE 0 — N01 FORENSIC REPORT

Data: 2026-09-30
Repository: divibisoul/aeternum-core-29
Current MAIN observado: 99fb9d22ddea3439c8b5be396ccae9e11ae3f66e
Baseline Fase 1 / marco-zero Clareira: 462fc7d4fc95bdff3307649a3b0c9abd9cffe98d

## Estado
O marco-zero é a base explícita da PR #37. O compare baseline→main, no intervalo auditado, retornou 66 commits e 49 arquivos, com 0 arquivos deletados e 0 renames. A árvore de tags não é mensurável pelo conector GitHub disponível.

O MAIN atual avançou depois daquela fotografia. O histórico atual mostra a reintegração do NeuralManagementCore e da continuidade HortaCore. Portanto NeuralManagementCore está no MAIN atual.

## Arquivos críticos
| Path | Baseline | MAIN | Classificação |
|---|---|---|---|
| src/core/EventBus.ts | sim | sim | [OK] |
| src/core/ModuleRegistry.ts | sim | sim | [OK] |
| src/core/neural/ProjetoClareira.ts | sim | sim | [OK] — 9 nós |
| src/core/neural/ProcessingNode.ts | sim | sim | [OK] |
| src/core/neural/HomeostasisManager.ts | sim | sim | [OK] estrutural / simulação legada |
| src/core/neural/InformationChannel.ts | sim | sim | [OK] |
| src/core/neural/types.ts | sim | sim | [OK] |
| src/core/neural/NucleoRaizAlma.ts | sim | sim | [OK] |
| src/core/PrecisionEngine.ts | sim | sim | [OK] |
| src/core/SelfLoop.ts | sim | sim | [OK] |
| src/core/mesh/SoulMeshRouter.ts | sim | sim | [OK] |
| src/core/hortaCore.ts | não | sim | [NOVO] — continuidade de memória |
| src/core/eventBus.ts | não | sim | [NOVO] — nervoVago, fachada delegadora |
| lib/aeternum/EventBus.ts | não | sim | [NOVO/RECUPERADO] — fachada delegadora |
| src/core/agi/NeuralManagementCore.ts | não | sim | [NOVO/REINTEGRADO] |

## V1 EventBus
[OK]

O EventBus canônico é src/core/EventBus.ts.

Métodos observados:
- on
- once
- emit
- off
- clear
- getLog
- listenerCount

on/once retornam funções de unsubscribe.

src/core/eventBus.ts e lib/aeternum/EventBus.ts delegam ao singleton canônico. Não existe segundo EventBus.

## V2 ModuleRegistry
[OK]

src/core/ModuleRegistry.ts continua o registry canônico React/UI. wormholeRegistry permanece uma camada distinta de capability/signature.

## V3 ProjetoClareira
[9 nós intactos]

- NC-001
- NP-001
- NP-002
- NP-003
- NS-001
- NS-002
- NS-003
- NS-004
- NS-005

Total: 9.

injectPacket e os eventos Clareira são expansões. Não houve redução da arquitetura.

## V4 neural/*
[OK estrutural]

Constantes críticas preservadas:
- THERMAL_STRESS_WARN = 0.7
- HOMEOSTASIS_CHECK_INTERVAL = 1000
- MAX_QUEUE_SIZE = 100
- REPORT_INTERVAL = 2000

PacketType mantém seis tipos.

HomeostasisManager ainda contém recuperação probabilística por Math.random(). Isso já existia no marco-zero: [SIMULADO] PREEXISTENTE / PENDING.

## V5 mesh/rgo/core
[OK]

Soul Mesh e HortaCore atuais permanecem preservados.

A cadeia RGO Trinity/HortaCore específica das PRs congeladas #24/#60/#54 continua BRANCH_ONLY e não foi incorporada ao MAIN nesta rodada.

## V6 App.tsx
[OK]

App mantém ModuleRegistry, EventBus, ProjetoClareira, AeternumAGI, AuthProvider e MainLayout.

Não foram encontrados window.prompt/window.alert/window.confirm no escopo pesquisado.

## V7 package/config
[OK estrutural]

package.json, tsconfig e Vite permanecem no projeto.

### Bloqueio de dependências descoberto durante C
npm ci no MAIN falha por drift entre package.json e package-lock.json. A saída do runner reportou:
- lock com picomatch 2.3.1 em desacordo com 4.0.7
- entradas picomatch 2.3.2 ausentes
- resolução atual contendo picomatch 4.0.7

Esse problema é independente do Core. O workflow da C usa npm install somente para o harness de validação e não reescreve o lockfile do MAIN.

## Simulações
- GEMHealth: leituras fisiológicas sintéticas quando não existe wearable; PR #68 corrige para NÃO MEDIDO/N-D.
- SelfHealingArchitecture: randomização de métricas/resultado de healing; legado, PENDING.
- HomeostasisManager: recuperação probabilística; legado, PENDING.
- ProjetoClareira.runSimulation: simulação explícita; não é runtime LIVE.

## SOTERRAMENTO / RECUPERAÇÃO
Não há arquivo crítico comprovadamente deletado do marco-zero.

Componentes antes históricos foram reintegrados no MAIN:
- NeuralManagementCore
- continuidade HortaCore
- módulos Aeternum recuperados

A prioridade atual é evitar duplicação entre frentes abertas.

## ENTREGA C — VALIDADA
PR #70:
https://github.com/divibisoul/aeternum-core-29/pull/70

Head final:
91e311924aa047af692b6701c60745d80e0ce08e

Base:
main @ 99fb9d22ddea3439c8b5be396ccae9e11ae3f66e

Arquivos da PR:
- .github/workflows/n01-core-continuity-restoration.yml
- lib/aeternum/EventBus.ts
- scripts/n01-core-continuity-check.mjs
- scripts/n01-ts-extension-loader.mjs

O guard executou e passou em CI. Ele prova:
1. AeternumEventBus delega ao EventBus canônico por aeternum:bridge.
2. nervoVago delega ao EventBus canônico.
3. Clareira mantém os 9 nós.
4. EventBus e ModuleRegistry permanecem acessíveis.

CI do HEAD final:
- N01 Core Continuity Restoration Guard #16 — SUCCESS
- SOUL Mesh regression #712 — SUCCESS
- Buried Aeternum recovery verification #15 — SUCCESS
- SOUL N01 validation #1001 — SUCCESS
- SOUL lifecycle #853 — SUCCESS

Durante a própria correção foram encontrados e eliminados falsos negativos do harness:
- npm ci bloqueado por drift de lockfile;
- import extensionless incompatível com Node ESM direto;
- evento incorreto observado no teste;
- campo de métrica incorreto: id, não nodeId.

A única alteração de runtime da PR é tornar explícito o sufixo .ts no import da fachada recuperada para execução ESM do harness. Nenhum segundo bus foi criado.

## A6–A10 — LIMITAÇÕES DO CONECTOR
O conector disponível não oferece checkout/árvore recursiva completa nem todos os comandos literais de git log --all -n 500, git diff --diff-filter=D/R e git diff --stat para todos os pares. Onde a prova integral não está disponível, o estado permanece NOT MEASURED/PENDING.

## PROIBIÇÕES RESPEITADAS
- PR #24/#60/#54 não mergeadas.
- ARA/ETR/ITR/ERU não reimplementados.
- Nenhum EventBus/Mesh paralelo.
- Nenhum arquivo runtime apagado.
- Nenhum LIVE claim.
