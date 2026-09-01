# SOUL Mesh — fechamento das 18 etapas

Data de referência: 2026-09-01 UTC
Fonte de verdade: branch `main` do `divibisoul/aeternum-core-29` + seis repositórios dos núcleos.

## Etapas 01–13

As etapas de contrato, discovery, health/circuit breaker, capabilities, adapters, transportes, multiplex, segurança, jobs assíncronos, observabilidade, runtime IA, ferramentas e grafo de integração já possuem alterações verificadas no histórico da `main`.

## Etapa 14 — Resiliência

Implementado `lib/soul-mesh/SoulMeshPeerResilience.ts`, reutilizando `SoulMeshHealth` em vez de duplicá-lo.

- saúde é mantida por peer;
- três falhas levam a `OPEN`/não roteável;
- após cooldown existe exatamente um probe `HALF_OPEN`;
- sucesso fecha o circuito;
- não há loop/background timer;
- teste dedicado criado.

Commits: `a6bb05a9154a73cb01bd393d74015a5940053e02`, `c25d32a4886d8021c54a7f71783c90b64eebb9c4`.

## Etapa 15 — CI/E2E

O pipeline `soul-mesh-regression.yml` foi adicionado para executar os testes reais das primitivas Mesh.

O smoke test N01→N06 foi corrigido para usar `contractVersion=1.1.0` e falhar fechado quando o endpoint N06 não estiver configurado; portanto um `skip` não pode mais ser confundido com sucesso E2E.

A validação geral N01 também foi tornada não-mutante.

Commits principais: `d099940fdfa523d9cd3fc8befb76e4a41ea25c93`, `a79d339683f8faccdc267cf55b6398d2147a6b86`, `8c34e77ff7b22916014ceae0cd73d787b16af340`.

Estado do gate no fechamento desta auditoria: workflow Mesh `queued`; portanto não aprovado ainda.

## Etapa 16 — Compatibilidade

Criado teste que mantém `version=1.0` como compatibilidade de transporte e fixa `contractVersion=1.1.0` como contrato canônico.

Commit: `580ecc8a6d59f3e206776c2aeded2f4fe3596bf0`.

## Etapa 17 — Orquestrador

Criado `lib/soul-mesh/SoulMeshOrchestrator.ts` para consumir o `SoulMeshCapabilityGraph` e `SoulMeshPeerResilience` existentes.

Características:
- limite de etapas;
- allowlist opcional de destinos;
- somente capabilities executáveis;
- somente transportes compatíveis;
- bloqueio de peers não roteáveis;
- validação de dependências DAG;
- nenhum novo sistema de transporte ou Mesh.

Teste dedicado criado.

Commits: `2d89ec8a35057118556661d3d367614ed7b06fd7`, `6512379c2a048845007487bd7f95f54159a537fa`, `5f0643bc8778b286a70fae4835bde3873af70f33`.

## Etapa 18 — Auditoria final

Regras de fechamento:

1. Código existente deve ser reutilizado antes de criar componente novo.
2. Capability declarada não é tratada como executável.
3. Execução estrutural não é tratada como prova E2E.
4. Alterações paralelas são rechecadas antes das escritas.
5. CI falho deve ser corrigido imediatamente.
6. Nenhum segredo é colocado no código.
7. Nenhum processo permanente é exigido para serverless.

### Estado real

Implementação estrutural das 18 áreas: concluída neste ciclo.

Prova automatizada: parcialmente concluída; o novo gate Mesh foi disparado e estava `queued` na última leitura.

Prova de deployment real entre os seis núcleos: ainda não comprovada nesta auditoria.

Logo, `100% implementado` e `100% operacional em produção` são métricas diferentes e não podem ser confundidas.
