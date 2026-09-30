# RGO — N01
Esta branch adiciona a fronteira executável da Regra de Ouro sem substituir o runtime existente.

## Papel
HortaCore em memória + nervoVago sobre EventBus real; RGO captura local e Mesh.

## Contrato
F → N(F) → D(F) → C(D(F)) → I → V → H.

O adaptador deste núcleo aceita findings com proveniência, evidência, estado epistêmico e correction boundary. O dual só é marcado como derivado quando a propriedade requerida está explicitamente declarada; caso contrário permanece UNRESOLVED.

## Integração
A comunicação entre núcleos continua usando Soul Mesh 1.1.0. O adaptador RGO produz mensagens com capability rgo.finding.ingest e preserva correlation_id/trace_id. Nenhum barramento paralelo é criado.

## Estado
Implementação reconciliação sobre main atual; promoção depende de CI verde e composição com SARA/N07.
