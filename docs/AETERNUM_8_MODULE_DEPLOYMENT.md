# AETERNUM — implantação distribuída em 8 módulos

Esta camada é aditiva. Ela não substitui o SOUL Mesh, não cria um segundo barramento de rede e não declara conexão operacional quando apenas o contrato está presente.

## Autoridades de infraestrutura

- O src/core/EventBus.ts permanece o EventBus de execução do N01.
- lib/aeternum/EventBus.ts é somente a fachada tipada AETERNUM sobre esse EventBus; ele não mantém transporte, histórico ou despacho independentes.
- lib/aeternum/HortaCore.ts é o armazenamento de estado AETERNUM.
- lib/aeternum/WormholeRegistry.ts é o registry dos oito domínios AETERNUM.
- N06 não cria EventBus, HortaCore ou Wormhole locais; sua camada de consciência recebe infraestrutura por binding explícito.

| Módulo | Autoridade | Repositório | Estado |
|---|---|---|---|
| M1 Core | N01 | aeternum-core-29 | implementado |
| M2 Orquestração | N01 | aeternum-core-29 | implementado |
| M3 Linguagem | N05 | fronteira SOUL Mesh | contrato federado |
| M4 Mind | N06 | nextjs-ai-chatbot-2000 | adaptador |
| M5 Percepção | N03 | nexus-aeternum-fusion | adaptador |
| M6 Imunidade | SARA/N07 | SARA | implementado por autoridades existentes |
| M7 Evolução | SARA/N07 | SARA | implementado por autoridades existentes |
| M8 Governança + Memória | SARA/N07 | SARA | implementado por autoridades existentes |

## Regra de prova

"implementado" significa código executável presente e testável no núcleo indicado; "adaptador" significa ponte preparada para o runtime proprietário; "contrato federado" significa que a autoridade continua no núcleo indicado; infraestrutura externa pendente nunca é simulada como execução.

## Regra de estado

Um estado READY, completed, healthy ou equivalente somente pode ser emitido quando existe evidência observável correspondente. Percentuais intermediários não devem ser inventados apenas para preencher uma UI.
