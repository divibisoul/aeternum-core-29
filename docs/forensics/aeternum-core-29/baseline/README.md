# N01 baseline — marco zero

- Repositório: `divibisoul/aeternum-core-29`
- Marco zero: `462fc7d4fc95bdff3307649a3b0c9abd9cffe98d`
- Motivo: SHA da base da PR #37, a primeira PR de integração Clareira do N01; portanto é o estado imediatamente anterior à Fase 1 Clareira neste protocolo.
- PR de referência: #37 — `integrate/clareira-octapla-2026-09-25` → `main`.

## Estado de extração

A referência Git do baseline foi confirmada e os arquivos críticos foram lidos diretamente nesse SHA. O conector GitHub disponível nesta sessão não expõe operação de worktree/checkout nem uma listagem recursiva da árvore do repositório. Portanto a exportação integral da árvore do baseline para este diretório está **NOT MEASURED**; não será fabricada.

## Arquivos críticos conferidos no baseline

- `src/core/EventBus.ts`
- `src/core/ModuleRegistry.ts`
- `src/core/neural/ProjetoClareira.ts`
- `src/core/neural/ProcessingNode.ts`
- `src/core/neural/NucleoRaizAlma.ts`
- `src/core/neural/HomeostasisManager.ts`
- `src/core/neural/InformationChannel.ts`
- `src/core/neural/types.ts`
- `src/core/gems/GEMHealth.ts`
- `src/core/agi/SelfHealingArchitecture.ts`
- `src/App.tsx`
- `package.json`

A ausência do snapshot recursivo não invalida as comparações de conteúdo acima; ela apenas impede declarar o PASS integral do requisito de árvore sem uma capacidade de checkout/arquivo-tree que o conector não fornece.
