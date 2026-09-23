# AETERNUM — implantação distribuída em 8 módulos

Esta camada é aditiva. Ela não substitui o SOUL Mesh, não cria um segundo barramento de rede e não declara conexão operacional quando apenas o contrato está presente.

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

Regra de prova: implementado significa código executável presente; adaptador significa ponte preparada para o runtime proprietário; contrato federado significa que a autoridade continua no núcleo indicado; infraestrutura externa pendente nunca é simulada.
