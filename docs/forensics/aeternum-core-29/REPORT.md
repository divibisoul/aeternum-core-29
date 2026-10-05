# FASE 0 — RELATÓRIO FORENSE N01
## `divibisoul/aeternum-core-29`

**Data da auditoria:** 2026-09-28  
**Ref auditada:** `main` @ `ed3eebdd590155244212dc725bc0f6812754b3d3`  
**Marco zero:** `462fc7d4fc95bdff3307649a3b0c9abd9cffe98d`  
**Critério do marco zero:** SHA da base da PR #37, a primeira PR de integração da Clareira do N01.  
**PR #37:** `integrate/clareira-octapla-2026-09-25` → `main`; head `2fe4fc660a24b0eb65af1548bcc1b4ee90d2d2ad`; merge `e4c41383c903f94dc0ce58316a290aa822885a6c`.  
**Responsável das PRs auditadas:** `divibisoul`.

## Resultado no topo

**PROGRESSO SUPER AGI: 15% (anterior: 15%)**

**STATUS DA AUDITORIA N01: CONCLUÍDA NO ESCOPO OBSERVÁVEL; FASE 0 GLOBAL NÃO CONCLUÍDA.**

A comparação GitHub disponível entre marco zero e `main` encontrou **66 commits**, **49 arquivos alterados**, **0 arquivos deletados** e **0 renomes/movimentos** reportados pelo endpoint de comparação.

Não foi encontrada evidência de soterramento ou substituição nos componentes críticos explicitamente exigidos: EventBus canônico, ModuleRegistry, os 9 nós Clareira, ProcessingNode, InformationChannel, HomeostasisManager, NucleoRaizAlma, App.tsx, PrecisionEngine, SelfLoop, SoulMeshRouter e SoulSuperCompute.

Há, porém, **déficit real que permanece pendente**: existem simulações de saúde/telemetria legadas que já estavam presentes no marco zero e, portanto, não foram causadas pela PR #37; também existem ramos históricos ainda não reintegrados, em especial o `NeuralManagementCore` do PR #48.

Nenhum código foi alterado nesta auditoria. Este PR registra evidência e delimita as reintegrações que realmente são justificadas.

---

# 1. Procedimento executado

### 1.1 Snapshot atual

Foi consultado o estado atual de `main`, branches, PRs relevantes, histórico de commits e o delta baseline→main.

**Branches visíveis antes da criação desta branch de auditoria:** 79.  
Após a criação desta branch de auditoria, o próprio branch passou a aparecer na listagem; o snapshot JSON registra essa situação e a limitação.

**Histórico de commits:** o endpoint de busca retornou 100 commits, embora tenha sido solicitado `topn=200`. A comparação baseline→main confirmou 66 commits no intervalo que interessa à Fase 0.

### 1.2 Marco zero

O marco zero foi fixado sem inferência:

- `462fc7d4fc95bdff3307649a3b0c9abd9cffe98d`
- É a base explícita da PR #37.
- Arquivos críticos foram lidos diretamente nessa ref.
- O conector não fornece worktree/checkout nem exportação recursiva da árvore. A árvore integral do baseline, portanto, permanece **NOT MEASURED**.

### 1.3 Diff baseline → main

Resumo do compare:

| Medida | Resultado |
|---|---:|
| Commits entre baseline e main | 66 |
| Arquivos alterados | 49 |
| Arquivos deletados reportados | 0 |
| Renames/moves reportados | 0 |
| Commit atual de main | `ed3eebd…` |
| Estado CI do commit atual via conector | NOT MEASURED (lista de status vazia; workflow-runs vazio) |

**Conclusão:** não há deleção de arquivo detectada no compare baseline→main. Isso não prova que nenhuma linha foi removida dentro de arquivos, apenas que nenhum arquivo foi removido.

---

# 2. Inventário forense dos subsistemas N01

| Subsistema | Localização | Estado atual | Evidência | Ação |
|---|---|---|---|---|
| EventBus canônico | `src/core/EventBus.ts` | ACTIVE | Baseline→main: somente +6/-0 | Manter único; não criar segundo bus |
| nervoVago | `src/core/eventBus.ts` | ACTIVE / FACADE | Arquivo adicionado; importa `./EventBus` e delega ao singleton real | Manter como fachada; não converter em bus independente |
| ModuleRegistry | `src/core/ModuleRegistry.ts` | ACTIVE | Arquivo não alterado no compare | Manter como registry React canônico |
| wormholeRegistry | `src/core/wormholeRegistry.ts` | ACTIVE / ADDITIVE | Arquivo novo; PR #43 documenta composição | Manter separado da API do ModuleRegistry |
| HortaCore | `src/core/hortaCore.ts` | ACTIVE / IN-MEMORY | Arquivo novo; camada declarada como complementar | Não confundir com persistência durável |
| GenesisModule | `src/core/GenesisModule.ts` | ACTIVE / ADDITIVE | Arquivo novo; bootstrap por `src/core/index.ts` | Manter como manifesto técnico |
| ProjetoClareira | `src/core/neural/ProjetoClareira.ts` | ACTIVE | 9 nós preservados; recebeu apenas adições | Continuar composição com EventBus |
| ProcessingNode | `src/core/neural/ProcessingNode.ts` | ACTIVE | +5/-0 baseline→main | Manter; testar sinais Clareira |
| InformationChannel | `src/core/neural/InformationChannel.ts` | ACTIVE | Sem delta baseline→main observado | Manter intacto |
| HomeostasisManager | `src/core/neural/HomeostasisManager.ts` | ACTIVE / LEGACY-RISK | +1/-0; evento `clareira.degraded` adicionado | Manter; remover simulação legada em correção futura |
| NucleoRaizAlma | `src/core/neural/NucleoRaizAlma.ts` | ACTIVE | Sem delta baseline→main observado | Manter |
| 9 nós Clareira | `NC-001`, `NP-001..003`, `NS-001..005` | ACTIVE | Instanciação atual mantém 1+3+5 = 9 | Preservar exatamente |
| PrecisionEngine | `src/core/PrecisionEngine.ts` | ACTIVE | Sem delta baseline→main no compare | Manter |
| SelfLoop | `src/core/SelfLoop.ts` | ACTIVE | Sem delta baseline→main no compare | Manter |
| SoulMeshRouter | `src/core/mesh/SoulMeshRouter.ts` | ACTIVE | Sem delta baseline→main no compare | Manter |
| SoulSuperCompute | `src/core/SoulSuperCompute.ts` | ACTIVE | Sem delta baseline→main no compare | Manter |
| SAIIC | `src/core/agi/SAIIC.ts` | ACTIVE / HARDENED | PR #46 remove dados sintéticos e false-green | Manter correção; adicionar medições reais quando houver fonte |
| AeternumAGI | `src/core/agi/index.ts` | ACTIVE / HARDENED | PR #46 substitui métricas aleatórias por estado real/null | Manter |
| GEMHealth | `src/core/gems/GEMHealth.ts` | ACTIVE / SIMULATED LEGACY | Código simula drift fisiológico | PENDING: trocar por fonte real ou estado explicitamente não medido |
| SelfHealingArchitecture | `src/core/agi/SelfHealingArchitecture.ts` | ACTIVE / SIMULATED LEGACY | Randomização de performance/memória/erro já existe no baseline | PENDING: correção dedicada, não restauração |
| Mesh peer client | `src/core/soul-mesh/peerClient.ts` | ACTIVE | `soul-mesh/1`, contrato 1.1.0 | Manter; random apenas como fallback de ID/jitter |
| SARA adapter | `scripts/sara-federation.mjs` | ACTIVE / EXTERNAL | Roteamento para operações SARA | SARA continua autoridade; integração real permanece dependente do serviço |
| Memória vetorial | Supabase/vector-memory + stores | ACTIVE / NOT FULLY MEASURED | Histórico de PR #16/#17 e scripts no main | Validar runtime real separadamente |
| NeuralManagementCore | `src/core/agi/NeuralManagementCore.ts` em branch | BURIED / UNMERGED | PR #48, branch `feat/neural-management-core-2026-09-28` | Avaliar reintegração aditiva após autorização da auditoria |
| 72 nódulos globais | escopo SOUL transversal | NOT MEASURED | Não existe inventário N01 source-backed de 72 itens nesta auditoria | Não inventar; requer inventário transversal posterior |

---

# 3. Casos específicos obrigatórios

## 3.1 EventBus

**Classificação: [OK].**

O arquivo canônico `src/core/EventBus.ts` existia no marco zero e continua sendo o EventBus utilizado pelos módulos centrais.

O arquivo adicional `src/core/eventBus.ts` não é um segundo barramento independente. Seu código importa:

`import { EventBus as RealEventBus } from './EventBus';`

e delega `emit/on/off` ao bus real, mantendo somente histórico local para observabilidade.

**Conclusão:** não houve soterramento do EventBus. A arquitetura atual deve continuar com **um único EventBus canônico**, com fachadas somente por delegação.

## 3.2 ModuleRegistry versus wormholeRegistry

**Classificação: [OK].**

`ModuleRegistry.ts` permanece no mesmo path e não aparece no delta baseline→main.

`wormholeRegistry.ts` foi adicionado posteriormente e implementa assinatura/capability registry complementar. Não substituiu a API React do ModuleRegistry.

**Conclusão:** não existe evidência de soterramento. O risco futuro é somente arquitetural: impedir convergência indevida entre as duas responsabilidades.

## 3.3 ProjetoClareira e 9 nós

**Classificação: [OK].**

O baseline e o main instanciam:

- `NC-001`
- `NP-001`
- `NP-002`
- `NP-003`
- `NS-001`
- `NS-002`
- `NS-003`
- `NS-004`
- `NS-005`

Total: **9 nós**.

As alterações posteriores adicionaram caminho federado `injectPacket`, correlação e eventos. Não houve redução dos nove nós.

**Conclusão:** Clareira não foi reduzida de 9 nós para um único nó.

## 3.4 ProcessingNode / InformationChannel / HomeostasisManager / types

- `InformationChannel.ts`: sem delta baseline→main observado.
- `types.ts`: sem delta baseline→main observado.
- `ProcessingNode.ts`: somente adições de telemetria/eventos Clareira.
- `HomeostasisManager.ts`: somente adição de evento `clareira.degraded`.

**Classificação: [OK].**

### Risco legado

`HomeostasisManager` usa `Math.random() < RECOVERY_CHANCE_PER_CHECK` para recuperação de nós. A mesma lógica está no baseline.

Portanto:

**[SIMULADO] PREEXISTENTE AO MARCO ZERO — não causado pela PR #37.**

Isso continua incompatível com a regra global do projeto e precisa de correção posterior, mas não deve ser falsamente registrado como regressão da Clareira.

## 3.5 PrecisionEngine / SelfLoop / SoulMeshRouter / SoulSuperCompute

Esses paths não aparecem no compare baseline→main.

**Classificação: [OK].**

Não existe evidência de substituição/simplificação nesses componentes no intervalo auditado.

## 3.6 App.tsx

O compare baseline→main registra `src/App.tsx` como **+1/-0**.

A versão atual mantém:

- AppErrorBoundary
- QueryClientProvider
- TooltipProvider
- Toaster
- AuthProvider
- LoginScreen
- MainLayout
- ModuleRegistry
- EventBus
- ProjetoClareira
- AeternumAGI
- boot sequence
- providers
- shutdown de Clareira/AGI

A única mudança estrutural observada no compare é aditiva.

**Classificação: [OK].**

O arquivo também contém um `Math.random()` usado para gerar uma experiência inicial e `setTimeout` de boot. Isso é legado de inicialização e existia antes; não foi criado pela Fase 1.

## 3.7 package.json / configs

`package.json`: +2/-1. A causa principal identificada no histórico é o commit `ae642dd380a5272e1d12f550604e33bf6896b2e0` — declaração explícita de Vite usado pelos scripts de build.

`tsconfig.json` e `vite.config.ts`: não aparecem no compare baseline→main.

**Classificação: [OK].**

`package-lock.json` recebeu sincronizações posteriores, inclusive commits dedicados de correção do lockfile.

**Classificação: [OK]**, sem evidência de perda de dependência original no escopo crítico.

---

# 4. Verificação de simulação / modalização

## 4.1 Modais

Busca atual:

- `window.prompt`: **0 ocorrências**
- `window.alert`: **0 ocorrências**
- `window.confirm`: **0 ocorrências**

**Classificação: [OK].**

Não há evidência de transformação dos componentes centrais em `window.*` modal.

## 4.2 generateResponse

Busca atual por `generateResponse`: **0 ocorrências relevantes encontradas**.

**Classificação: [OK].**

## 4.3 sleep usado como cura

As ocorrências encontradas de `sleep(` correspondem a:

- retry/backoff de rede
- pequenos intervalos de scripts de diagnóstico
- probes de Mesh

Nenhuma ocorrência auditada corresponde a cura/remediação fictícia.

**Classificação: [OK] no critério específico.**

## 4.4 Math.random em saúde/métricas

Foram encontradas ocorrências reais no main.

### `GEMHealth.ts`

O código contém literalmente a lógica de “Simulate physiological drift when no wearable connected”, alterando por `Math.random()`:

- heartRate
- hrv
- stressLevel
- fatigueIndex

A mesma lógica foi encontrada no marco zero.

**Classificação: [SIMULADO] PREEXISTENTE / PENDING.**

### `SelfHealingArchitecture.ts`

Randomização de:

- memoryUsage
- performance
- errorRate
- resultado de sucesso de healing

A mesma lógica foi encontrada no marco zero.

**Classificação: [SIMULADO] PREEXISTENTE / PENDING.**

### `SAIIC.ts` e `src/core/agi/index.ts`

Esses eram pontos fortes de telemetria sintética no histórico pós-Fase1 e foram corrigidos na PR #46:

- CPU/memória/erro sem medição passaram a `null`;
- estado real passou a ser usado para health;
- latência de Mesh deixou de ser inferida de timestamp de scan;
- correção sintética de erro/memória foi removida.

**Classificação: [OK] — correção legítima anti-simulação.**

Isso não deve ser revertido em nome de “restaurar o original”, porque o original continha precisamente o comportamento sintético que o contrato atual proíbe.

---

# 5. Arquivos alterados no delta baseline → main

A matriz completa retornada pelo compare GitHub foi:

| Path | Classificação | Δ + / - | Ação |
|---|---|---:|---|
| `.env.example` | [OK] | +5/-2 | Manter; revisar secrets sem valores reais |
| `.github/workflows/android-build.yml` | [OK] | +2/-0 | Manter |
| `.github/workflows/main.yml` | PENDING | +86/-608 | Exigir patch linha-a-linha completo antes de classificar deleções internas |
| `.github/workflows/n01-android-remediation-validation.yml` | [OK] | +47/-0 | Manter |
| `.github/workflows/n01-deno-edge-validation.yml` | [OK] | +26/-0 | Manter |
| `.github/workflows/n01-dependency-lock-repair.yml` | [OK] | +43/-0 | Manter |
| `.github/workflows/n01-internal-mesh-diagnostic.yml` | [OK] | +41/-0 | Manter |
| `.github/workflows/n01-mesh-boot-diagnostic.yml` | [OK] | +43/-0 | Manter |
| `.github/workflows/n01-remediation-validation.yml` | [OK] | +56/-0 | Manter |
| `.github/workflows/soul-n01-validation.yml` | [OK] | +2/-0 | Manter |
| `.github/workflows/soul-sentinel-build.yml` | [OK] | +2/-0 | Manter |
| `__tests__/core.spec.ts` | [OK] | +59/-0 | Manter como cobertura aditiva |
| `docs/N01-ANDROID-VALIDATION-TRIGGER-2026-09-27.md` | [OK] | +5/-0 | Manter |
| `docs/SOUL-N01-VALIDATION-2026-09-27.md` | [OK] | +15/-0 | Manter |
| `lib/soul-mesh/SoulMeshPeerResilience.test.ts` | [OK] | +9/-8 | Manter; validar que não usa fake server |
| `package-lock.json` | [OK] | +747/-263 | Manter sincronizações; não reescrever cegamente |
| `package.json` | [OK] | +2/-1 | Manter Vite/build alignment |
| `scripts/core-test.mjs` | [OK] | +12/-0 | Manter |
| `scripts/n01-chat-edge-contract-check.mjs` | [OK] | +20/-0 | Manter |
| `scripts/orchestrator_n07_optimized.py` | [OK] | +246/-0 | Manter; fonte legada preservada |
| `scripts/soul-mesh-local-contract-check.mjs` | [OK] | +21/-2 | Manter |
| `scripts/soul-mesh-server-entry.mjs` | [OK] | +5/-0 | Manter |
| `scripts/soul-mesh-server.mjs` | [OK] | +33/-5 | Manter; executor local real/erro explícito |
| `scripts/soul-supergpu.mjs` | [OK] | +6/-2 | Manter |
| `shared/clareira-contract.ts` | [OK] | +90/-0 | Manter como contrato de aplicação sobre Mesh |
| `src/App.tsx` | [OK] | +1/-0 | Preservar |
| `src/components/AGIActivePanel.tsx` | [OK] | +1/-1 | Manter correção anti-false-green |
| `src/components/AGIDashboard.tsx` | [OK] | +1/-1 | Manter correção anti-false-green |
| `src/components/SystemStatusIndicator.tsx` | [OK] | +4/-2 | Manter estados reais |
| `src/components/auth/ApiKeySetup.tsx` | [OK] | +7/-4 | Manter alinhamento N07 |
| `src/components/layout/Telemetry.tsx` | [OK] | +17/-9 | Manter sem métricas inventadas |
| `src/core/EventBus.ts` | [OK] | +6/-0 | Preservar como bus único |
| `src/core/GenesisModule.ts` | [OK] | +77/-0 | Manter |
| `src/core/agi/SAIIC.ts` | [OK] | +76/-56 | Não reverter; remove false-green |
| `src/core/agi/index.ts` | [OK] | +50/-48 | Não reverter; remove métricas sintéticas |
| `src/core/eventBus.ts` | [OK] | +62/-0 | Fachada delegadora, não segundo bus |
| `src/core/hortaCore.ts` | [OK] | +59/-0 | Manter; reconhecer limite de persistência |
| `src/core/index.ts` | [OK] | +14/-0 | Manter bootstrap |
| `src/core/neural/ClareiraBridge.ts` | [OK] | +22/-0 | Manter |
| `src/core/neural/HomeostasisManager.ts` | [OK] | +1/-0 | Manter evento Clareira; legado random pendente |
| `src/core/neural/ProcessingNode.ts` | [OK] | +5/-0 | Manter |
| `src/core/neural/ProjetoClareira.ts` | [OK] | +43/-0 | Preservar 9 nós + packet path |
| `src/core/neural/index.ts` | [OK] | +2/-0 | Manter export |
| `src/core/neuralCoordinates.ts` | [OK] | +36/-0 | Manter |
| `src/core/wormholeRegistry.ts` | [OK] | +67/-0 | Manter como registry complementar |
| `src/hooks/useProjetoClareira.ts` | [OK] | +8/-1 | Manter bridge/metrics |
| `src/integrations/supabase/previewAuthStorage.ts` | [OK] | +1/-2 | Manter; validar somente comportamento real |
| `supabase/functions/chat/index.ts` | PENDING | +106/-193 | Mudança grande de backend; intenção N07-only confirmada no histórico, mas patch integral não foi reproduzido pelo conector |
| `supabase/functions/check-api-key/index.ts` | PENDING | +51/-66 | Mesma ressalva: migração N07-only é documentada, mas classificação linha-a-linha permanece incompleta |

### Observação sobre PENDING

Os itens PENDING acima não foram classificados como SOTERRADO/SUBSTITUÍDO/SIMPLIFICADO porque isso exigiria reconstrução integral do patch. Não há evidência suficiente para acusar regressão, mas também não há base técnica para declarar [OK] definitivo sem a linha-a-linha completa.

---

# 6. Mapa original → atual → restauração

| Original | Atual | Path restaurado | Resultado |
|---|---|---|---|
| `src/core/EventBus.ts` | mesmo path | nenhum | Sem perda comprovada |
| `src/core/ModuleRegistry.ts` | mesmo path | nenhum | Sem perda comprovada |
| `src/core/neural/ProjetoClareira.ts` | mesmo path, enriquecido | nenhum | 9 nós preservados |
| `src/core/neural/ProcessingNode.ts` | mesmo path, enriquecido | nenhum | Preservado |
| `src/core/neural/InformationChannel.ts` | mesmo path | nenhum | Preservado |
| `src/core/neural/HomeostasisManager.ts` | mesmo path, evento adicional | nenhum | Preservado; legado random pendente |
| `src/core/neural/types.ts` | mesmo path | nenhum | Preservado |
| `src/App.tsx` | mesmo path, +1/-0 | nenhum | Preservado |
| PrecisionEngine | mesmo path | nenhum | Sem delta observado |
| SelfLoop | mesmo path | nenhum | Sem delta observado |
| SoulMeshRouter | mesmo path | nenhum | Sem delta observado |
| SoulSuperCompute | mesmo path | nenhum | Sem delta observado |
| `wormholeRegistry` | novo path | não havia no baseline | Adição, não restauração |
| `hortaCore` | novo path | não havia no baseline | Adição, não restauração |
| `nervoVago` | novo path | não havia no baseline | Fachada, não substituição |
| `NeuralManagementCore` | somente branch do PR #48 | ausente do main | Reintegração futura, após decisão |

**Conclusão:** para os componentes críticos do baseline, a ação de restauração é **nenhuma**, porque a evidência atual não demonstra perda. Criar arquivos `.original.ts` duplicados sem perda demonstrada seria redundância arquitetural e não engenharia de restauração.

---

# 7. Simulações encontradas

### SIMULADOS que já existiam antes da Fase 1

1. `src/core/gems/GEMHealth.ts` — drift fisiológico via `Math.random()`.
2. `src/core/agi/SelfHealingArchitecture.ts` — health/performance/memory/error sintéticos.
3. `src/core/neural/HomeostasisManager.ts` — probabilidade aleatória de reativação.
4. `src/core/neural/ProjetoClareira.ts` — `runSimulation()` e seleção aleatória em fluxo de estímulo.
5. Outros componentes AGI/UI também usam random para métricas ou variação visual; cada caso exige classificação específica.

**Não foram removidos nesta PR de auditoria.**

Motivo: Fase 0 deve estabelecer causalidade e plano de reintegração. Alterar o legado simulado seria uma correção de runtime posterior, não “restaurar baseline”.

---

# 8. Modalização

Nenhum uso de:

`window.prompt`  
`window.alert`  
`window.confirm`

foi encontrado no escopo pesquisado do main.

**Resultado: [OK].**

---

# 9. Integração com Clareira e soul-mesh/1

## EventBus

A Clareira usa o EventBus canônico:

`src/core/EventBus.ts`

O bridge Clareira importa o mesmo singleton. Não há um bus separado.

## soul-mesh/1

O N01 mantém:

- protocolo `soul-mesh/1`
- contrato `1.1.0`
- `SoulMeshProtocol.ts`
- `SoulMeshRuntime.ts`
- `SoulMeshRouter`
- peer client
- HTTP ingress
- correlação por `correlationId`

A documentação e os arquivos runtime consultados apontam para `soul-mesh/1` como transporte canônico.

## Clareira Packet

`shared/clareira-contract.ts` define Clareira como camada de aplicação sobre o Mesh, não segundo transporte.

## SARA

O runtime N01 contém adapter de federação para SARA e mantém SARA como autoridade das operações:

- `sara.health`
- `sara.capabilities`
- `sara.state`
- `sara.cycle`
- `sara.audit`
- `sara.regenerate`
- `sara.trace`

A presença estrutural está comprovada; execução contra um serviço SARA externo não foi medida nesta auditoria.

## clareira-metrics-consumer

Não foi localizado um componente N01 local com esse nome. O N01 produz eventos/métricas Clareira via `ClareiraBridge`; consumo federado posterior pertence a camadas externas/N07 e não foi declarado como local sem evidência.

---

# 10. Subsystems soterrados / branches históricas

## NeuralManagementCore

Branch:

`feat/neural-management-core-2026-09-28`

PR:

**#48 — feat: structure neural management core and canonical parameters**

Diferença reportada contra main atual: 17 commits à frente, sem commits atrás.

Adições principais:

- `src/core/agi/NeuralManagementCore.ts`
- extensão de `src/core/agi/index.ts`
- `src/soul-neural/N07NeuralBridge.ts`
- teste `src/core/soul/N01Foundation.test.ts`

**Classificação:** BURIED / UNMERGED, mas **não** “restaurado do baseline”, porque esse subsistema não existia no marco zero usado nesta auditoria.

**Ação:** avaliar como expansão aditiva posterior; não copiar para main nesta etapa.

## Histórico Fase 2 / Core Aeternum

PR #43 foi mesclada e trouxe para main:

- `eventBus.ts`
- `hortaCore.ts`
- `wormholeRegistry.ts`
- `neuralCoordinates.ts`
- `index.ts`
- `GenesisModule.ts`
- testes do Core

Isso significa que esses ativos não estão soterrados atualmente.

---

# 11. PRs históricas importantes

### PR #37 — Clareira canônica
**MERGED.**  
18 commits, 11 arquivos, +950/-268.  
Adicionou bridge/contrato/eventos/ingress sem remover o núcleo neural.

### PR #43 — Core Aeternum reconciliado
**MERGED.**  
12 commits, 12 arquivos, +721/-608.  
Preservou EventBus, ModuleRegistry e Clareira.

### PR #45 — runtime truth
**OPEN, não mergeada.**  
Proposta inicial anti-false-green.

### PR #46 — runtime truth reconciliado
**MERGED no current main.**  
1 commit, 9 arquivos, +182/-121.  
Removida telemetria sintética e caminhos false-green.

### PR #47 — Mesh security/execution state
**OPEN / DRAFT.**  
12 commits, 5 arquivos, +206/-31.  
Não faz parte do main auditado nesta Fase 0.

### PR #48 — NeuralManagementCore
**OPEN / DRAFT.**  
18 commits, 8 arquivos, +416/-57.  
Não faz parte do main auditado nesta Fase 0.

---

# 12. Reintegração

## Reintegração automática realizada nesta auditoria

**NENHUMA.**

Isso é deliberado.

Não foi encontrada perda comprovada dos componentes críticos do baseline. Criar cópias paralelas de arquivos que já estão intactos violaria a finalidade da auditoria e aumentaria duplicação.

## Reintegrações reais pendentes

1. `NeuralManagementCore` do PR #48 — avaliar e integrar de forma aditiva.
2. Resolver PENDING de `.github/workflows/main.yml` por patch completo.
3. Resolver PENDING de `supabase/functions/chat/index.ts` por patch completo.
4. Resolver PENDING de `supabase/functions/check-api-key/index.ts` por patch completo.
5. Corrigir simulações pré-baseline sem apagar a implementação original: substituir a fonte sintética por medições reais ou estado explícito **N/D**, preservando o contrato e o código histórico em path documentado quando houver colisão.
6. Fazer auditoria transversal dos 72 nódulos quando existir inventário source-backed.

---

# 13. Validação

| Gate | Estado | Evidência |
|---|---|---|
| Baseline SHA identificado | PASS | `462fc7d4...` |
| Main SHA identificado | PASS | `ed3eebdd...` |
| 66 commits baseline→main identificados | PASS | GitHub compare |
| Arquivos deletados baseline→main | PASS = 0 encontrados | GitHub compare |
| Renames/moves baseline→main | PASS = 0 encontrados | GitHub compare |
| EventBus único | PASS estrutural | imports + facade delegadora |
| ModuleRegistry preservado | PASS estrutural | sem delta no compare |
| Clareira 9 nós | PASS estrutural | 1 NC + 3 NP + 5 NS |
| App original preservado | PASS estrutural | +1/-0 |
| Modal `window.*` | PASS | busca sem ocorrências |
| `generateResponse` fake | PASS | busca sem ocorrência relevante |
| sleep-cura | PASS no escopo pesquisado | nenhuma ocorrência correspondente |
| Math.random em saúde/telemetria | BLOCKED/PENDING | existe legado prebaseline |
| Build atual | NOT MEASURED | status/workflow-runs vazios no conector |
| Testes atuais | NOT MEASURED | status/workflow-runs vazios no conector |
| Árvore recursiva do baseline | NOT MEASURED | conector sem operação recursiva/worktree |
| Tags do repositório | NOT MEASURED | conector sem enumeração de tags |
| Todos os commits de todas as branches, objeto por objeto | NOT MEASURED | conector enumera branches, não reconstrução integral de objetos |
| Diff linha-a-linha de todos os 49 arquivos | NOT MEASURED | compare expõe stats; patches foram extraídos apenas para riscos prioritários |

---

# 14. Critério de Fase 0

Este documento **não declara Fase 0 global concluída**.

Para o N01, o resultado atual é:

**AUDITORIA DOCUMENTAL: PASS no escopo observável.**  
**REINTEGRAÇÃO DE BASELINE: nenhum caso de perda crítica comprovado.**  
**RUNTIME BUILD/TEST: NOT MEASURED nesta sessão.**  
**SIMULAÇÕES LEGADAS: PENDING.**  
**PR #48 NeuralManagementCore: PENDING reintegração.**

Nenhum arquivo foi deletado por esta auditoria. Esta branch contém somente os artefatos forenses da Fase 0.

---

# 15. Mantra de governança

NADA SERÁ EXCLUÍDO. TUDO SERÁ CORRIGIDO.  
NADA SERÁ SUBSTITUÍDO. TUDO SERÁ EXPANDIDO E CONECTADO.  
NADA SERÁ EXCLUÍDO. TUDO SERÁ CORRIGIDO.  
NADA SERÁ SUBSTITUÍDO. TUDO SERÁ EXPANDIDO E CONECTADO.

---

## Referências principais

- PR #37 — Clareira: https://github.com/divibisoul/aeternum-core-29/pull/37
- PR #43 — Core Aeternum: https://github.com/divibisoul/aeternum-core-29/pull/43
- PR #46 — runtime truth reconciliado: https://github.com/divibisoul/aeternum-core-29/pull/46
- PR #47 — Mesh security/execution: https://github.com/divibisoul/aeternum-core-29/pull/47
- PR #48 — NeuralManagementCore: https://github.com/divibisoul/aeternum-core-29/pull/48
- Main auditado: https://github.com/divibisoul/aeternum-core-29/tree/main
