# SOUL — Plano de Integração em 6 Etapas

## Regra de execução
Uma etapa só é considerada concluída quando houver implementação verificável, teste/validação e evidência no repositório. Não avançar por documentação ou por mera presença de arquivos.

## Etapa 1 — Contratos e conexão funcional dos 6 sistemas
Objetivo: transformar os seis repositórios em componentes funcionais de um único Soul, sem duplicar Android.

- Mapear capacidades únicas.
- Definir contratos de EventBus, Capability, AI Provider, Context, Memory, Tool Request/Result.
- Criar adapters para Sentinel, Eternium, Nexus e Chat.
- Classificar os três Chatbots e consolidar somente capacidades não duplicadas.
- Testar fluxo ponta a ponta entre componentes.
**Critério de saída: 6 componentes inicializáveis e comunicando-se por contratos reais.**

## Etapa 2 — Android Bridge / Percepção
Objetivo: conectar o Soul ao Android sem replicar funções nativas.

- Sentinel como camada de percepção/telemetria.
- Device state, UsageStats, bateria, permissões, notificações e capacidades realmente disponíveis.
- Bridge de comandos atrás do Guardian.
- Eventos Android → EventBus.
- Requests → Guardian → Executor.
**Critério de saída: Soul detecta e utiliza capacidades Android reais, sem duplicá-las.**

## Etapa 3 — AI Gateway e cognição
Objetivo: integrar Eternium/Gemini e demais providers sem tornar nenhum deles o Soul.

- Provider-neutral gateway.
- Normalização request/response.
- Health/capability negotiation.
- Seleção de provider.
- Remover chamadas diretas de Gemini dos módulos consumidores.
- Segredos somente em configuração segura/backend.
**Critério de saída: Core pode trocar provider sem alterar a arquitetura do Soul.**

## Etapa 4 — Nexus + voz + multimodalidade + conversação
Objetivo: incorporar as capacidades úteis do Nexus e Chatbot ao Soul.

- Entrada/saída de voz.
- Multimodalidade.
- Chat/streaming.
- Contexto e sessão.
- UI adaptada ao Android.
- Reaproveitar funcionalidades sem carregar aplicações Web inteiras desnecessariamente.
**Critério de saída: conversa, voz e multimodalidade funcionam através do Core.**

## Etapa 5 — Memória, contexto, Guardian e otimização
Objetivo: transformar percepção + cognição em comportamento contextual e seguro.

- Memory Core.
- Context Engine.
- Self Model.
- Guardian/policies.
- Ledger de conhecimento.
- Correlação de telemetria/contexto.
- Otimizações que agreguem valor real, sem substituir Android.
**Critério de saída: Soul consegue perceber, correlacionar, decidir e agir dentro das políticas.**

## Etapa 6 — APK, integração final e validação no dispositivo
Objetivo: produzir o Soul instalável e provar funcionamento real.

- Build reproduzível.
- Debug APK.
- Testes unitários/integrados.
- Smoke test Android.
- Permissões/capabilities reais.
- Instalação no aparelho.
- Logs e diagnóstico.
- Correção dos erros encontrados.
- Release candidate.
**Critério de saída: APK instalado e fluxo principal validado no dispositivo.**

## Métrica obrigatória em cada atualização
Toda alteração deve informar:
- etapa;
- área alterada;
- arquivos/commit;
- porcentagem anterior;
- porcentagem atual;
- evidência do que funciona;
- bloqueios restantes.

## Estado inicial
Etapa 1: 35% — contratos/runtime ainda incompletos.
Etapas 2–6: aguardando conclusão da etapa anterior.
