# SOUL Admin Plus — Auditoria Forense de Recuperação e Continuidade

Data: 2026-09-22
Escopo: branch `feat/soul-admin-android-plus-final` e interfaces reais de N07/SARA inspecionadas em GitHub.
Princípio: o estado verificável do código prevalece sobre declarações anteriores.

## Resultado executivo

A auditoria encontrou frentes incompletas e erros introduzidos na própria implementação anterior. Eles foram corrigidos de forma aditiva quando o contrato já estava verificável.

A branch do Plus permanece sobre o `main` atual sem divergência para trás: `main` = `480ad4d8ed8814e4aa2c3d69043390d90658e52c`; branch Plus auditada = 112 commits à frente, 0 atrás no momento desta auditoria. Nenhum arquivo foi removido pela frente Plus.

## Erros corrigidos nesta auditoria

1. N07 Android client enviava `X-Correlation-ID` ausente e corpos incompatíveis com os contratos reais de `/v1/execute` e `/v1/intent`.
2. Configuração podia deixar token antigo criptografado após o usuário limpar o campo; endpoint SARA vazio também podia permanecer persistido.
3. IntentQueueManager perdia a prioridade efetiva em rajadas e engolia falhas sem evidência.
4. RUN CYCLE do cockpit criava um `MissionControl` separado, bypassando o runtime compartilhado e a política do watchdog.
5. PrivilegedAuthGate compartilhava uma continuation entre chamadas concorrentes.
6. Diagnóstico privilegiado podia executar I/O de shell a partir do fluxo da interface.
7. NNAPI foi anteriormente tratado como prova de NPU físico. Isso foi corrigido para `NPU=UNKNOWN` e `NNAPI=disponível/não disponível` separadamente.
8. AuthAndSignature não implementava a preferência Ed25519 com fallback para P-256. A preferência/fallback foi adicionada e o alias P-256 legado foi preservado.
9. DashboardStateStore possuía risco de lost-update entre writers concorrentes; foi serializado com Mutex.
10. GEMDevice podia conservar telemetria antiga como válida após disconnect/error; o estado agora invalida `metricsAvailable`.
11. AGIActivePanel ainda desenhava barras com dados não observados; as barras passaram a depender de telemetria efetivamente disponível.
12. Retenção de logs havia sido declarada como configurável, mas não estava efetivamente conectada ao ciclo de sincronização. Agora existe parâmetro persistido e purga aplicada durante sync.
13. Root/Shizuku tinham allow-list de binários, mas ainda aceitavam metacaracteres de shell que permitiriam encadeamento/redirecionamento. Foi criado um validador comum e aplicado aos dois canais.
14. Watchdog não tinha detecção explícita de risco de ANR, snapshot local nem redução de frequência sob proteção. Foram adicionados ANR check real, snapshot persistido do estado do cockpit e redução de polling.

## Frentes preservadas / não esquecidas

### PR #25 — N01 consolidação
Estado: OPEN / PRESERVADA / não integrada.
A branch `consolidacao-n01` continua sendo uma frente independente. O bloqueio de CI permanece registrado nela.

### PR #27 — ERU ↔ SOUL ↔ SARA
Estado: OPEN / PRESERVADA / não integrada.
Esta frente contém o artefato ERU e mudanças adicionais de Clareira/AGI/Neural. Ela não foi apagada nem substituída pelo Plus. Como está divergente do `main`, sua integração futura exige rebase/merge forense e revisão de conflitos, especialmente nos arquivos que também foram modificados pelo Plus.

### PR #29 — Soul Admin Plus
Estado: OPEN / DRAFT / frente corrente.
A camada Android Plus permanece aditiva. N01..N07 e SARA mantêm autoridades distintas.

### N02, N03, N05, N06 e N07
Os canais de coordenação continuam registrados nos próprios repositórios. A existência de um issue de handoff não é tratada como prova de runtime online; execução real ainda depende de teste de tráfego correlacionado.

## Bloqueios ainda reais

### CI/runner
Os reruns mais recentes do N01 continuam terminando em `failure` sem steps e sem logs recuperáveis; a consulta de logs retorna `BlobNotFound`. O rerun foi tentado novamente e reproduziu o mesmo padrão. Não existe evidência válida para declarar `gradle assembleDebug`, testes Kotlin, build web ou E2E como PASS.

### Execução Android local
O ambiente de trabalho não possui Gradle/Android SDK utilizável para uma build real local. Portanto não é permitido transformar análise estática em alegação de APK executável.

### Comissionamento real
Ainda faltam um dispositivo/emulador Android executando a build e um endpoint SARA/N07 configurado para testes online. Sem isso, a integração é classificada como IMPLEMENTADA/VALIDAÇÃO OPEN, não ONLINE.

### OctaCore
A especificação agora está DESBLOQUEADA pela definição autoritativa fornecida para G0–G7. O que permanece BLOQUEADO é a certificação operacional/E2E: cada slot precisa de contrato executável, health/capability observável e transporte real. Nenhuma capacidade foi apagada ou substituída.

### TCE / compute/transcendental
O pacote legado `compute/transcendental` do N07 continua ISOLADO e DESABILITADO por padrão. Ele contém `SimulatedExecutor` e é uma camada de simulação determinística, não uma prova de hardware nem um caminho de execução produtivo. Não foi apagado.

## Classificação final

- SOUL Admin Plus — IMPLEMENTAÇÃO REAL / VALIDAÇÃO BLOQUEADA POR INFRAESTRUTURA E COMISSIONAMENTO.
- SARA client — CONTRATO REAL / ONLINE NÃO PROVADO.
- N07 client — CONTRATO REAL / ONLINE NÃO PROVADO.
- RootGate — IMPLEMENTADO / hardware root NÃO PROVADO.
- Shizuku boundary — IMPLEMENTADO / serviço externo NÃO PROVADO.
- Watchdog — IMPLEMENTADO / comportamento de campo ainda requer execução no Android.
- Room/DataStore — IMPLEMENTADO / testes de execução ainda dependem de runner Android.
- TFLite validator — IMPLEMENTADO como componente real, porém sem modelo embarcado: `UNAVAILABLE_MODEL`; não é substituto do SARA.
- Gemini/AI provider remoto — não anunciado como AVAILABLE sem evidência.

## Próximo gate único

Restaurar uma execução de CI observável; em seguida executar build + testes; depois comissionar APK e executar SARA/N07 online/offline, watchdog, canal privilegiado e uma transação correlacionada real.

Nenhuma certificação de produção deve ser atribuída antes dessas evidências.


## Recovery pass II — pós-auditoria

A segunda passagem encontrou mais três problemas de integração e os corrigiu:

- O runtime compartilhado ainda podia iniciar em corrida concorrente entre Activity e Service; o lifecycle foi serializado.
- O watchdog podia pausar WorkManager, mas uma nova missão ainda podia ser enfileirada; a pausa agora é aplicada também no boundary de enqueue.
- Resultado de ciclo SARA era persistido apenas no log; agora `lastCycleId` e `lastTraceHash` também alimentam o DashboardStateStore, com ressincronização persistente no runtime.
- O loop legado do Soul Admin reduz sua própria frequência sob proteção do watchdog.
- N07 foi corrigido no próprio repositório para propagar `X-Correlation-ID` ao SARA proxy; foi adicionada cobertura de teste específica para esse header.

Estado N07 após a correção: main = `b33cf720379aa17dfbe45a01fbc423d24806a69c`.
Estado SARA: sem alteração nesta passagem; contrato inspecionado continua o limite autoritativo para o client.


## Unfreeze — Octacore/HortaCore/Vagus/Mesh fusion

The Plus front is now ACTIVE rather than frozen for this stage. The Android layer remains a control/telemetry client and does not become a second SARA or second Mesh.

- OctacoreClient: real authenticated N07 Octacore transport.
- DashboardStateStore: persists Octacore/G7 health alongside existing SARA/N07 state.
- Cockpit: observes Octacore health and G0–G7 inventory.
- N07/G7 remains scheduler + SuperGPU owner.
- Existing N07 SuperGPU runtime is attached once to Octacore; no duplicate compute runtime.
- HortaCore is fused into the same N07 runtime and emits control events through VagusBus.
- N07 remote jobs use the canonical Soul Mesh.
- G6 can invoke the full federated context flow through N07 Mesh with the original correlation ID.
- Existing Plus watchdog/root/auth/logging/mission facilities remain preserved.

## Current evidence correction — 2026-09-23

The historical entries above are preserved. During the Octacore fusion pass, one real accidental deletion was discovered in `src/sara/meta/octacore_kernel.py`: the `_worker_loop` implementation and additional G0 kernel methods had been removed during an earlier slicing-based merge. They were explicitly restored rather than replaced with a new implementation. The latest branch comparisons show zero removed files.

Current Plus state:

- **UNFROZEN / ACTIVE IMPLEMENTATION** for the HortaCore ⊕ VagusBus ⊕ Mesh ⊕ Octacore integration stage.
- Added authenticated `HortaCoreClient` over the existing N07 `/v1/execute` contract.
- Added persistent HortaCore health to DashboardStateStore and cockpit visibility.
- Existing OctacoreClient, SARAClient, N07Client, watchdog, root/auth, logging and mission facilities remain intact.
- No second Mesh, scheduler or SARA authority was introduced.
- APK build/install and Android field commissioning remain OPEN.

The current certification boundary remains: N07 Octacore/HortaCore focused gate PASS; G0 SARA validation OPEN until its own CI returns PASS.


## Audit pass III — Octacore corrective wave

- Octacore specification: **UNBLOCKED**.
- G0–G7 inventory: all eight slots retained.
- G1–G6 adapters are classified by source evidence; runtime liveness is not inferred.
- G7 is attached to the canonical existing SuperGPU runtime at the final wiring boundary; no second production SuperGPU is introduced.
- Barrier semantics were corrected to be independent of job-list ordering and to publish one join event per barrier.
- N04 adapter runtime is dynamically loaded only after capability validation, keeping server-only imports out of isolated adapter tests.
- N06 now advertises the Octacore wrapper separately from N06-owned cognitive capabilities.
- N03 legacy peer client was extended to the canonical N07-inclusive topology.
- Android Shizuku was moved away from removed/legacy direct process API toward the real UserService binder boundary; AIDL generation was enabled explicitly.
