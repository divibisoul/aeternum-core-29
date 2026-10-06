# ERU ↔ SOUL ↔ SARA — Auditoria Forense e Fusão Arquitetural
Data: 2026-09-22
Branch: eru-soul-fusion-2026-09-22

## 1. Baseline observado

O repositório N01 já possui:
- contrato SOUL federado;
- Soul Mesh;
- integração SARA;
- capabilities sara.*;
- runtime Node/TypeScript;
- documentos de preservação e auditoria;
- dados ERU já expostos em ChatEngine.

SARA já possui um ERU_Engine v2, ERUDriftDetector, ERUTrinityBridge, TrinityERUUnified, snapshots, provenance e integração com ConnectedRuntime.

Conclusão: a nova ERU não deve ser criada como uma segunda autoridade. O material novo é tratado como expansão arquitetural e de runtime a ser absorvida pelos componentes existentes.

## 2. Gaps reais do material novo

### ERU-G-001 — execução simulada no controller fornecido
O exemplo ERUCoreController retorna SUCCESS construindo um dicionário, sem executar a tarefa real.

Estado: INVALID como prova de execução.
Ação: preservar como material histórico/proposta; impedir promoção a runtime real.

### ERU-G-002 — VagusNerveBus é somente in-process
O VagusNerveBus apresentado usa memória local e callbacks. Isso não demonstra Redis/gRPC, baixa latência distribuída ou persistência.

Estado: IMPLEMENTAÇÃO LOCAL, não barramento distribuído comprovado.
Ação: mapear como transporte local e adaptar ao SoulBus/Soul Mesh quando distribuição for necessária.

### ERU-G-003 — BayesianMetaLearner não é uma calibração Bayesiana comprovada
A fórmula usa percentuais de completude/sintaxe/sucesso histórico como likelihoods, mas não demonstra que essas variáveis sejam likelihoods probabilísticas calibradas.

Estado: PROPOSTO/HEURÍSTICO.
Ação: preservar fórmula como experimento; separar confiança heurística de probabilidade calibrada.

### ERU-G-004 — limiar 0.85 não é evidência
0.85 é uma política de decisão. Não deve autorizar execução consequencial sozinho.

### ERU-G-005 — Docker/Qdrant/Redis não equivalem a infraestrutura ativa
O compose descreve uma topologia possível. Sem build, startup e health evidence, estado é PROPOSTO/EXECUTION_REQUIRED.

### ERU-G-006 — memória de três camadas ainda não está conectada ao ownership existente
SOUL possui memória/contexto; SARA possui TemporalVectorDB/RegenerativeMemory; N07 possui storage. É necessário definir autoridade e adapters antes de duplicar estado.

### ERU-G-007 — "self-healing" requer mecanismo e teste
A cadeia detection→classification→isolation→recovery→verification→rollback/commit deve ser demonstrada.

## 3. Fusão de responsabilidades

| Função | SOUL | ERU | SARA | N07 |
|---|---|---|---|---|
| Runtime/capabilities | autoridade nativa | observa/coordena | valida/regenera | federação |
| Mesh | autoridade N01/SOUL Mesh | cliente/observador | serviço federado | roteamento |
| Auditoria | diagnósticos locais | reversibilidade/drift | autoridade regenerativa | execução registrada |
| Memória operacional | contexto/runtime | snapshots/evidência | memória regenerativa/proveniência | storage federado |
| Rollback | boundary local | reconstrói/identifica perda | autoridade de rollback | coordena execução |
| Model provider | gateway | adapter | governança | roteamento |
| Privileged Android | Guardian | nunca diretamente | policy/validation | nunca diretamente |

## 4. Ponte canônica

```
SOUL Runtime
   ↓
SOUL Event/Capability Contract
   ↓
ERU Adapter
   ↓
ERU Snapshot / Drift / Evidence Contract
   ↓
SARA ERU_Engine + Governance
   ↓
SARA HTTP federation
   ↓
N07 routing / federation
```

Nenhuma camada recebe autoridade que pertence à outra.

## 5. Memória integrada

```
Working Context
     ↓
SOUL runtime state
     ↓
ERU snapshot/evidence
     ↓
SARA provenance + regenerative memory
     ↓
validated durable knowledge
```

A implementação deverá evitar que "working memory", "episodic memory" e "semantic memory" criem três cópias autoritativas do mesmo estado.

## 6. Event bridge

Eventos mínimos:
- eru.snapshot.created
- eru.capability.snapshot
- eru.drift.detected
- eru.recovery.candidate
- eru.execution.evidence
- eru.validation.result
- sara.cycle.request
- sara.cycle.result

Todo evento federado deve carregar correlation_id, source, target/provider, timestamp, version, payload e resultado/error.

## 7. Gemini

O material "Gemini = consciousness" será normalizado para:

```
Provider
→ Model Adapter
→ Inference Contract
→ Cognitive Orchestrator
→ Consciousness abstraction
```

Isso preserva a arquitetura conceitual sem converter uma integração de modelo em afirmação ontológica.

## 8. Segurança

ERU não recebe privilégio Android diretamente.

Fluxo:
```
ERU/Agent
→ Tool Request
→ SOUL Guardian
→ Policy
→ Authorization
→ Executor
→ Evidence
```

SARA pode validar a operação; N07 pode roteá-la; nenhum deles contorna Guardian.

## 9. Tríade aplicada à fusão

Yang: execução, expansão, throughput e delegação.
Yin: contenção, rollback, validação, preservação e fail-closed.
Relação: não utilizar números sem medição.

Cada finding de excesso de Yang sem Yin, ou Yin sem capacidade de ação, gera finding MMD e passa pela RGO.

## 10. Próximos gates

1. Auditar o ERU existente no SARA contra este contrato.
2. Auditar a integração ERU existente no N01.
3. Implementar apenas adapters/capabilities que não existam.
4. Executar typecheck/tests/CI reais.
5. Reauditar SARA↔N01.
6. Propagar somente contratos validados ao N07.
7. Comprovar transação real SARA↔SOUL/ERU.

## 11. Regra de preservação

Nenhum módulo existente será apagado por causa desta fusão. Duplicação é classificada como autoridade, adapter, compatibilidade ou legado preservado.

## 12. Estado desta documentação

Esta documentação é IMPLEMENTED como artefato documental E2 quando commitada. Ela não constitui prova de runtime E3+.
