# SOUL Mesh — Plano Mestre de Construção

## Regra
Construir como um prédio: uma etapa só é concluída quando houver evidência verificável no código. Nenhuma conexão será marcada como ativa apenas por configuração declarativa.

## Ordem obrigatória

### Fase 0 — Inventário e baseline
- congelar a arquitetura atual dos 6 núcleos;
- registrar proprietários das capabilities;
- registrar duplicações e dependências;
- não apagar funcionalidades existentes.

**Saída:** mapa mestre N01–N06 + baseline.

### Fase 1 — Contrato da Mesh
Definir e validar:
- `id`
- `correlationId`
- `source`
- `target`
- `kind`
- `capability`
- `payload`
- `timestamp`
- request/response/event/error

**Critério:** contrato único e versionado.

### Fase 2 — Transporte
Implementar/verificar:
- endpoint receptor real;
- serialização/deserialização;
- envio;
- recebimento;
- erro HTTP;
- timeout;
- retry controlado.

**Critério:** uma mensagem atravessa o transporte e chega ao processo receptor.

### Fase 3 — Node/RPC
Implementar:
- dispatch por target;
- correlation map;
- request/response;
- ACK;
- timeout;
- erro;
- idempotência básica.

**Critério:** N-A envia request para N-B e recebe response correlacionada.

### Fase 4 — Identidade e segurança
- identidade do núcleo;
- autenticação do canal;
- autorização por capability;
- política de risco;
- rejeição de origem/target inválidos.

### Fase 5 — Capability Mesh
- registry global;
- discovery;
- proprietário único por capability;
- consumidores remotos;
- versionamento;
- compatibilidade.

### Fase 6 — Health e observabilidade
Cada conexão deve reportar:
- ONLINE/OFFLINE/DEGRADED/ERROR;
- último heartbeat;
- latência;
- último erro;
- capabilities disponíveis.

### Fase 7 — Malha 6×6
Se cada núcleo possuir 5 IN + 5 OUT:
- 30 canais IN;
- 30 canais OUT;
- 15 pares bidirecionais;
- 60 endpoints lógicos.

Cada par deve passar por discovery → handshake → auth → capability negotiation → ping → request → ACK → response → health.

### Fase 8 — Integração do Soul Runtime
Somente após as fases anteriores:
- Capability Router;
- Nucleus Registry;
- Mesh Router;
- AI Pilot;
- Android Bridge;
- Event Bus;
- Permission Manager.

### Fase 9 — APK unificado
Somente depois da malha E2E:
- integrar os módulos no runtime Android;
- preservar o Núcleo 01 como camada Android nativa;
- empacotar N01–N06 como um único sistema/APK;
- validar build e execução.

## Regra de progresso
Uma etapa = 100% somente com código + teste/evidência. Percentuais abaixo de 20% por etapa não serão usados como substituto de trabalho real.

## Estado inicial
Fase 0: INVENTÁRIO EXISTENTE — concluída parcialmente nos repositórios.
Fases 1–9: aguardam execução sequencial.
