# SOUL — Matriz Forense Transversal de Infraestrutura
Data: 2026-09-24
Status: FORENSE / SEM MERGE AUTOMÁTICO

## Regra de preservação
Nenhum componente existente é removido nesta auditoria. Correções são aditivas, por compatibilidade e por evidência.

## Identidade operacional observada

SOUL é uma infraestrutura federada composta por:
- N01/Aeternum: host/edge e runtime local, incluindo Soul Mesh e subsistemas neurais.
- N02–N06: núcleos federados com runtimes próprios; a disponibilidade real é determinada por handshake/capability discovery, não por documentação.
- N07/Orquestrador: plano de orquestração, scheduler e SuperGPU software runtime quando o repositório/serviço correspondente está conectado.
- SARA: autoridade regenerativa; cycle/audit/regenerate permanecem no domínio SARA.
- Soul Admin Android: superfície operacional local; não substitui SARA nem cria uma segunda autoridade regenerativa.

## Clareira — evidência e integração

src/core/neural/ProjetoClareira.ts existe como implementação concreta e é inicializado pelo App/hooks. Possui:
- NucleoRaizAlma;
- 3 nós primários;
- 5 nós secundários;
- canais InformationChannel;
- HomeostasisManager;
- métricas e estado operacional.

Antes desta auditoria havia dois pontos de risco:
1. estímulo sem alvo desconhecido caía em seleção aleatória;
2. estímulo sem alvo escolhia nó aleatoriamente.

Correção implantada nesta frente:
- alvo inexistente agora falha explicitamente;
- seleção sem alvo usa round-robin somente entre nós ativos;
- foi preservada toda a API existente.

Integração implantada:
- neural.clareira.status
- neural.clareira.stimulus
- neural.clareira.decision

As capacidades são expostas pelo runtime Mesh N01 existente; não foi criado um segundo transporte.

## Limites de evidência

Não declarar como ONLINE:
- peer remoto sem resposta correlacionada;
- capability apenas documentada;
- backend configurado mas sem execução observada;
- Octacore apenas reservado sem scheduler/worker real;
- SuperGPU sem conexão real.

## Princípios de engenharia usados

A malha deve preservar correlação ponta a ponta (correlation_id/trace context), pois sistemas distribuídos precisam propagar contexto entre processos para correlacionar traces, métricas e logs. A prática é consistente com OpenTelemetry.

Paralelismo deve respeitar ciclo de vida, cancelamento e limites de concorrência; no Android/Kotlin isso significa structured concurrency, e no Go o contexto deve acompanhar cancelamento/deadline através das fronteiras de execução.

## Próxima sequência de auditoria

1. Comparar cada frente Octacore com o estado atual do seu main.
2. Reconciliar somente divergências comprovadas, sem sobrescrever evolução posterior.
3. Auditar N07 SuperGPU como runtime existente, não como nome/documentação.
4. Auditar SARA G0 contra os contratos HTTP reais.
5. Auditar N04/G4 e N06/G6 contra os runtimes efetivamente executáveis.
6. Auditar N02/N03/N05 e marcar PENDING_REPO somente onde não houver implementação verificável.
7. Executar CI/build/testes e registrar resultado real.
8. Só então consolidar a matriz G0–G7.

## Fontes técnicas externas

- Kotlin structured concurrency: https://kotlinlang.org/docs/coroutines-basics.html
- Go pipelines/cancellation: https://go.dev/blog/pipelines
- Go context: https://go.dev/blog/context
- OpenTelemetry context propagation: https://opentelemetry.io/docs/concepts/context-propagation/