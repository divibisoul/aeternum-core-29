# Matriz Forense — ERU ↔ MMD/RGO ↔ Tríade ↔ Clareira ↔ Seis Núcleos

Data: 2026-09-22

## Autoridades

| Área | Autoridade |
|---|---|
| ERU / reversibilidade e snapshots | SARA `ERU_Engine` existente |
| Clareira / runtime neural | SOUL N01 |
| Estado Clareira recebido/validado | SARA `ClareiraSubsystem` |
| MMD | adaptador derivado de transições ERU estáveis |
| RGO | adaptador de propostas de capacidades complementares |
| Tríade | `TrinityERUUnified` → ARA/ETR/ITR |
| Mesh / federação | SOUL Mesh/N07 conforme contratos existentes |
| Percepção/áudio | N03/Nexus, sem duplicação |

## Fluxo

`Clareira state → SARA ERU freeze → stable transition diff → MMD derivation → RGO proposal → Trinity assessment → sara.clareira.audit → N01/N02/N03/N04/N05/N06 consumers`

A operação de auditoria é somente leitura. Nenhum consumidor recebe autorização de mutação por consultar o resultado.

## Frentes abertas

| Frente | PR | Estado no momento da auditoria |
|---|---:|---|
| N01 SOUL + Clareira | #27 | OPEN / unmerged |
| SARA + ERU/MMD/RGO/Tríade | #5 | OPEN / unmerged |
| N02 | #16 | OPEN / unmerged |
| N03/Nexus | #12 | OPEN / unmerged |
| N04 | #17 | OPEN / unmerged |
| N05 | #16 | OPEN / unmerged |
| N06 | #12 | OPEN / unmerged |

## Evidência

E2: branches, código, contratos, adapters e testes estáticos/integrativos presentes.

E3/E4: não promovidos nesta rodada. Há workflows atuais terminando em `failure` ou ainda `in_progress`; para alguns jobs o conector não disponibiliza steps/logs, portanto não é possível atribuir a causa sem evidência.

E5: não afirmado enquanto execução reproduzível, validação independente e reaudit final não forem observáveis.

## Regra de preservação

Nenhum `main` dos núcleos foi alterado por estas extensões. Cada frente nova usa branch próprio. Correções substituem somente lógica ativa comprovadamente incompatível, preservando histórico/proveniência.

## Estado semântico do MMD/RGO

O MMD não reage a `timestamp`, `source` ou `correlationId` como massa estrutural. Alterações operacionais continuam observáveis.

RGO gera propostas `PROPOSED`, nunca execução automática.

A avaliação da Tríade permanece uma avaliação; `IMPLEMENTED` não é convertido em `EXECUTED` sem runtime real.
