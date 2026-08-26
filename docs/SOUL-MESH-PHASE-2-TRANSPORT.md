# Soul Mesh — Fase 2: Transporte

## Implementado
- `SoulMeshMessage`: modelo canônico JSON para a rede.
- `SoulMeshHttpTransport.start()`: abre receptor HTTP real.
- `SoulMeshHttpTransport.send()`: envia POST JSON e lê resposta.
- validação do contrato antes do dispatch;
- validação de método/path/content-length;
- ACK HTTP com `correlationId` preservado;
- limites de conexão e timeouts básicos;
- `INTERNET` permission no APK.

## Segurança deliberada
O receptor padrão é `127.0.0.1`. Isso permite validar o transporte sem expor um endpoint sem autenticação na LAN. Autenticação/autorização pertence à Fase 4.

## O que ainda NÃO é considerado concluído
- RPC completo com espera por response final;
- retry/backoff;
- autenticação;
- autorização por capability;
- discovery entre os seis núcleos;
- health/heartbeat;
- prova E2E entre N01–N06.

## Critério de conclusão da Fase 2
O código agora possui caminho real `POST -> parser -> validação -> onMessage -> ACK`. A conclusão operacional da fase exige executar esse caminho em build/teste Android, não apenas a existência dos arquivos.
