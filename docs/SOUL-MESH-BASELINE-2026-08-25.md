# SOUL Mesh — Baseline Fase 0 — 2026-08-25

## Objetivo
Congelar o estado arquitetural antes da implementação sequencial da Mesh. Este documento não declara conexões E2E ativas.

## Regra de evidência
- Código existente = capacidade implementada.
- Registry/route = capacidade ou rota declarada.
- Transporte + endpoint + correlação + ACK/response + health = conexão comprovada.
- Não promover estado declarativo a CONNECTED.

## Núcleos auditados

| Núcleo | Repositório | Função arquitetural atual | Estado para Mesh |
|---|---|---|---|
| N01 | `divibisoul/aeternum-core-29` | Android/native/Sentinel | capability layer existente; Mesh E2E pendente |
| N02 | `divibisoul/nextjs-ai-chatbots` | AI/tools/documents/context | ferramentas e Chat Pilot existentes; Mesh E2E pendente |
| N03 | `divibisoul/nexus-aeternum-fusion` | conhecimento/domínio/fusão | auditoria anterior registrada; Mesh E2E pendente |
| N04 | `divibisoul/nextjs-ai-chatbots` | AI/chat/tools/context | compartilhar capacidades, sem duplicação; Mesh E2E pendente |
| N05 | `divibisoul/nextjs-ai-chatbot-2000` | AI/tools/artifacts/mesh | protocolo/mesh existente; nomenclatura histórica N05 precisa normalização |
| N06 | `divibisoul/nextjs-ai-chatbot-2000` | suporte integral/contexto/documentos/artifacts | afinidade definida; transporte E2E pendente |

## Observação sobre nomenclatura
Os registros históricos usados durante a construção podem conter Nucleus05/N05 mesmo quando o projeto agora está sendo tratado como N06. Isso deve ser corrigido somente depois de mapear todas as referências para evitar quebra de contratos.

## Capabilities confirmadas como famílias

### N01 — Android
- device info
- battery
- memory
- network
- Android events
- Shizuku bridge
- brightness
- Wi-Fi
- Bluetooth
- airplane settings
- background-process controls

### AI/tool nuclei
- chat/streaming
- tool execution
- create document
- update document
- request suggestions
- weather/external data
- artifacts
- document handlers
- AI Pilot boundary

### Mesh
- message envelope
- request/response/event/error
- correlation ID
- source/target
- capability field
- transport abstraction
- HTTP transport
- node abstraction
- peer matrix
- health layer
- E2E contract

## Duplicação identificada
As famílias `createDocument`, `updateDocument`, `requestSuggestions`, `getWeather`, artifacts, chat e streaming aparecem em mais de um projeto. Antes da fusão, cada uma precisa receber um proprietário único. O objetivo é reutilização por contrato, não cópia do código.

## Malha alvo
Para 6 núcleos, com 5 IN + 5 OUT por núcleo:
- 30 IN
- 30 OUT
- 15 pares bidirecionais
- 60 endpoints lógicos

Nenhum desses 60 canais é considerado CONNECTED apenas por existir no registry.

## Dependências de construção
1. Fase 0 — este baseline.
2. Fase 1 — contrato versionado.
3. Fase 2 — transporte + receptor real.
4. Fase 3 — Node/RPC + ACK + correlation.
5. Fase 4 — identidade/segurança.
6. Fase 5 — capability discovery/routing.
7. Fase 6 — health/observabilidade.
8. Fase 7 — malha 6×6 E2E.
9. Fase 8 — Soul Runtime.
10. Fase 9 — APK unificado.

## Critério para encerrar Fase 0
O baseline está encerrado somente quando os seis repositórios, suas capacidades principais, duplicações e dependências estiverem representados sem alegar conectividade que não tenha sido demonstrada.

## Próxima ação permitida
Somente iniciar a Fase 1 após validar este baseline contra os seis repositórios. Não implementar Runtime/APK antes disso.
