# CHANGELOG-N01

## 2026-09-03 — Revisão de consolidação da PR #25

### Correções críticas

- Unificada a implementação de `src/core/soul/SoulMeshEnvelope.ts` como facade da implementação canônica em `lib/soul-mesh/SoulMeshEnvelope.ts`, eliminando criptografia/validação duplicadas.
- Corrigido `src/core/soul/MeshRouter.ts` para usar a criação de envelope canônico existente, impedir rota para si próprio e manter a seleção de transporte exclusivamente no `CanonicalTransportAdapter`.
- Adicionada cobertura de integração do `MeshRouter` ao teste de transporte canônico.
- Restaurada a configuração Java 17/Kotlin JVM 17 removida acidentalmente do `soul-sentinel/app/build.gradle.kts`.
- Alinhados `SoulMeshRemoteClient.describe()` e `listCapabilities()` com as capacidades canônicas do gateway (`mesh.fusion.describe` e `mesh.capabilities`).
- Rebaseadas as constantes de protocolo de `N01Contract` na implementação canônica do envelope, mantendo o arquivo como contrato de compatibilidade.

### Hardening

- `scripts/mesh-diagnose.mjs` agora valida JSON e endpoints, usa `randomUUID` explícito e AbortController para cancelar requisições no timeout.
- `scripts/soul-fusion-runtime-check.mjs` agora usa contrato fixo `1.1.0`, timeout limitado, valida endpoint HTTP(S) e exige correlação/origem/destino exatos.
- `N01Contract.validateCapabilityContract()` recebeu validação runtime das coleções, IDs, métricas, status e limites.
- `package.json` passou a expor um comando `npm test` único para os gates existentes, além de `typecheck` e `verify`, sem alterar as dependências do baseline.

### Arquitetura/documentação

- Criado `docs/N01-architecture.md` com autoridades canônicas, Mesh, integridade, capabilities, roteamento cognitivo, storage, Sentinel, diagnóstico e fronteira de certificação.
- Mantida a política de uma única PR canônica: #25.
- Mantida a distinção entre certificação estrutural e prova de runtime remoto.

### Estado de validação

Os testes locais completos (`npm ci`, build, lint, test e Android) não podem ser declarados PASS nesta execução porque este agente não possui um executor local do repositório conectado ao ambiente GitHub. Os workflows do repositório permanecem a autoridade de execução; os runs anteriores falharam antes de iniciar steps, com evidência de runner não atribuído. Portanto, este changelog registra correções de código, não uma falsa certificação.
