# N01 ↔ SARA

A integração está na branch canônica consolidacao-n01 / PR #25.

N01 expõe sara.cycle, sara.audit, sara.regenerate, sara.state e sara.capabilities pelo mesmo gateway Mesh existente.

Configuração server-side: SARA_SERVICE_URL, SARA_SERVICE_TOKEN, SARA_REQUEST_TIMEOUT_MS.

O N01 preserva ownership das capacidades de coordenação/transportes. SARA adiciona auditoria, regeneração, memória, evidência e rollback como camada complementar.

Sem serviço SARA configurado, a chamada retorna erro explícito e nunca um estado simulado.