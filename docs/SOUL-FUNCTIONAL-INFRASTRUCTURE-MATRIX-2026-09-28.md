# SOUL — Matriz Funcional Transversal — 2026-09-28

## Regra estrutural

Este documento é um inventário operacional, não substitui os runtimes. Ele organiza as relações entre módulos existentes, não cria uma segunda implementação.

**Regra do projeto:** nada é excluído. Correções são aditivas, preservam identidade e conectam funções já existentes.

## Identidade atual

SOUL é a camada de sistema/Android + Mesh que integra os núcleos. Aeternum/Nexus são domínios computacionais e cognitivos especializados. N07 é o plano de orquestração/federação e hospeda o **Octacore**, que é um processador de sistema/GPU de software. SARA é a autoridade regenerativa e ético-estrutural.

## Matriz N01–N07 + SARA

| Domínio | Repositório | Dono funcional | Transporte/integração | Estado de execução |
|---|---|---|---|---|
| G0 | SARA | ARA/ETR/ITR, ciclo, auditoria, regeneração, estado, trace | SARA HTTP + VagusBus | REAL / autoridade; online depende de comissionamento |
| G1 | aeternum-core-29 | Android, host gateway, local Clareira, Mesh ingress | Android + Soul Mesh | REAL / host |
| G2 | Eternium- | conversação/inferência e seu runtime | Soul Mesh 1.1 + HMAC | REAL no código / E2E depende ambiente |
| G3 | nexus-aeternum-fusion | áudio/percepção/multimodal | Soul Mesh + peer registration | REAL no código / E2E depende ambiente |
| G4 | nextjs-ai-chatbots | tools/docs/research/context | Soul Mesh / runtime N04 | REAL no código / adapter Octacore em integração |
| G5 | nextjs-ai-chatbot | inference/dispatch e gateway próprio | Soul Mesh + HMAC/replay | REAL no código / E2E depende ambiente |
| G6 | nextjs-ai-chatbot-2000 | cognição/session/tool dispatch | Soul Mesh + N06 dispatcher + SARAClient | REAL no código / adapter Octacore em integração |
| G7 | Orquestrador- | scheduler, federation, SuperGPU, Octacore | Mesh + SARA Proxy + Vagus control | REAL / CI validado no head da PR #43 |
| SARA | SARA | autoridade regenerativa e governança estrutural | HTTP/Vagus | REAL no runtime; online não assumido |

## Octacore

Os oito slots mantêm identidades separadas:

G0=SARA, G1=N01, G2=N02, G3=N03, G4=N04, G5=N05, G6=N06, G7=N07.

O Octacore é o processador de sistema que coordena jobs, não uma CPU octa-core de silício. N07 agenda e executa; SARA não perde sua autoridade.

## Planos funcionais

**Control plane:** VagusBus — health, capability, signal/throttle/degrade/halt/resume, prioridade, TTL e correlation.

**Execution/data plane:** Soul Mesh — peer transport, delegation, capability discovery, HMAC/correlation/replay e respostas.

**Compute substrate:** N07 SuperGPU existente — CPU/accelerators descobertos conforme disponibilidade; backend inexistente não deve virar sucesso simulado.

**Regeneration authority:** SARA — cycle/audit/regenerate/state/trace.

**Cognition:** N07 cognitive R1 — Goal → Plan → Act → Observe, discovery-first, Prefrontal critique, Working Memory e persistência. A camada continua feature-flagged.

## Clareira — cadeia observada

### Caminho local

`ProjetoClareira` → `ProcessingNode` → `EventBus` → `ClareiraBridge` → métricas/telemetria.

Esse caminho é funcional no código: `ProjetoClareira.injectPacket()` envia para um nó real e `ProcessingNode.processLoop()` emite `clareira.packet.processed`.

### Caminho federado N05 → N01

N05 `ClareiraBridge` → `soul-mesh/1` → N01 `clareira.ingest` → fila de ingress.

**Descoberta crítica:** o servidor `scripts/soul-mesh-server.mjs` mantém uma fila de ingress, mas não há um consumidor que retire essa fila e invoque `ProjetoClareira.injectPacket()`. Portanto, antes da correção, o ACK significava **accepted/queued**, mas N05 contabilizava como processed.

A correção em andamento separa:
- `accepted`: entrada aceita pelo gateway;
- `processed`: processamento efetivamente confirmado pelo runtime.

Até existir consumidor/ACK de processamento real, a travessia federada da Clareira é **INGRESS-ONLY / BLOQUEADA para processamento remoto**, não ONLINE.

### Simulação

`ProjetoClareira.runSimulation()` é mantida porque o projeto é não-destrutivo, mas fica classificada como **SIMULAÇÃO INTERNA**. Não pode ser usada como prova de operação produtiva.

## Integridade de telemetria

Foi encontrado uso histórico de `Math.random()` em vários componentes para gerar IDs, flutuações e métricas. Isso não pode ser usado como health/performance real. A auditoria separa:
- geração de IDs pseudoaleatórios: não é telemetria e não implica simulação;
- métricas/health geradas por random: **não confiáveis como evidência**;
- testes Fake/Mock: permitidos somente dentro de testes, nunca como prova de produção.

## Estado dos aterros / sobreposição

As frentes paralelas anteriores continuam preservadas. A consolidação deve acontecer por interfaces de ownership, adapters e contratos compartilhados.

- PR #41: prova de federação continua preservada.
- PR #42: Cognitive R1 original continua preservada.
- PR #43: branch sucessora reconciliada contra o N07 main atual; ela é a trilha de integração em vez de substituir #42.
- PRs antigas de N01 continuam preservadas.

## Gates de evidência

**IMPLEMENTED:** código e contrato existem.

**CI VALIDATED:** workflow do commit exato concluiu sucesso.

**INTEGRATED:** tráfego real entre processos/serviços foi observado com correlation e resposta válida.

**ONLINE:** endpoint/componente respondeu no ambiente de execução requerido.

**UNMEASURABLE:** não existe observabilidade suficiente; não deve ser convertido em PASS.

**BLOCKED:** há dependência externa/contrato/runtime ausente.

## Correções pendentes prioritárias

1. Concluir ligação física de runtime da fila remota da Clareira ao `ProjetoClareira`, somente quando houver um consumidor real/contrato de execução verificável.
2. Comissionar E2E N01↔N02…N07 com endpoints/secrets reais; sem valores inventados.
3. Reconciliar adapters Octacore G2/G3/G4/G5/G6 contra os commits atuais de cada repositório, evitando branches stale.
4. Adicionar contexto federado real ao pipeline cognitivo apenas onde o produtor estiver comprovadamente conectado.
5. Avaliar e substituir, gradualmente e de forma não-destrutiva, métricas produtivas sintéticas por fontes reais; preservar métodos de teste/simulação explicitamente classificados.

## Referências de engenharia

- Propagação de cancelamento/deadline deve seguir `context.Context` através das fronteiras de execução.
- WebGPU é capability-gated: o runtime pode não possuir `navigator.gpu` ou um adapter compatível; ausência deve resultar em fallback/erro real, não em emulação.
- Circuit breaker deve tratar estado fechado/aberto/half-open e evitar avalanche de chamadas.
