# N01 — agentes e responsabilidades locais

Este catálogo não cria um segundo registro de agentes. Ele documenta apenas responsabilidades pertencentes ao N01.

## Agentes locais

| Agente | Estado | Responsabilidade | Evidência |
|---|---|---|---|
| N01.cognitive-fabric | CATALOG_ONLY | Registrar agentes, resolver capability por disponibilidade/confiabilidade/latência, manter memória, evidência, observações, políticas aprendidas e homeostase. | `src/soul-fusion/SoulCognitiveFabric.ts` |
| N01.neocortex-prefrontal | CATALOG_ONLY | Expor a fronteira prefrontal local para registrar agentes, fatos, evidências e avaliação de consenso. | `src/soul-fusion/NeoCortexPrefrontal.ts` |
| N01.gateway-mesh | CATALOG_ONLY | Manter o gateway Mesh canônico e o contexto de runtime/dispositivo do N01. | `scripts/soul-mesh-server.mjs`, `src/core/EventBus.ts`, `src/core/hortaCore.ts` |

**Regra:** estes nomes são catálogo estrutural até existir registro/executor explícito no runtime. Não declarar ONLINE/EXECUTABLE por este documento.

**Não pertence ao N01:** roteamento central N07, execução de ferramentas N04, inferência N05, percepção de áudio N03 ou regeneração/governança SARA.
