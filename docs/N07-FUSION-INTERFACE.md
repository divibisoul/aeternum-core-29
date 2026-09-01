# N01 ↔ N06 ↔ N07 — Interface de Fusão

Este documento é um contrato de preparação para a fusão final. O N07 permanece a última peça a ser alterada; até a fusão, N01 e N06 continuam operando com seus contratos atuais.

## Estado real observado

- N01 é o registry/gateway e coordena discovery, registration, delegation, retries e circuit isolation.
- N06 expõe capabilities próprias, ferramentas, agentes e execução via Mesh.
- N07 possui um runtime próprio e deve receber, na fusão, as entradas e saídas das conexões que hoje atravessam N01 e N06.

## Regra de compatibilidade

Os consumidores atuais N01/N06 utilizam `soul-mesh/1` com `contractVersion` `1.1.0`. O N07 possui um contrato próprio mais recente. Nenhuma alteração unilateral de versão deve ser feita antes da fusão; a etapa N07 deverá escolher e implementar um único contrato canônico, com adaptadores de compatibilidade somente quando necessários.

## Fluxo final esperado

`entrada → N01 registry/gateway → N07 orchestrator → capability owner → N06/tool/runtime quando aplicável → resultado → N07 → N01/cliente`

N01 continua responsável por identidade, descoberta, registro e fronteira Mesh. N07 assume coordenação, composição, decisão de rota e correlação do fluxo. N06 permanece dono das capabilities e ferramentas que seu runtime declara executáveis.

## Regras de propriedade

Uma capability deve possuir um único owner executivo. N07 pode compor capacidades de múltiplos owners, mas não deve duplicar seus runtimes. Ferramentas de N06 devem continuar usando contexto autenticado e a identidade do usuário.

## Dados mínimos que a fusão deve preservar

`protocol`, `contractVersion`, `messageId`, `correlationId`, `traceId` quando presente, `source`, `target`, `kind/type`, `capability/operation`, `timestamp`, `nonce`, `metadata` e `payload`.

## Segurança

A fusão deve preservar autenticação, anti-replay, limite de payload, validação de destino, clock skew, rate limiting e circuit protection já existentes. Nenhuma camada pode enfraquecer uma proteção de outra.

## Critério de prontidão

A fusão somente estará concluída quando existir tráfego E2E real entre N01, N06 e N07, com correlação preservada, capability executada pelo owner correto, resultado devolvido ao chamador e métricas/latência observáveis. Arquivos presentes ou endpoints HTTP respondendo não constituem prova de integração.
