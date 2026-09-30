# AETERNUM — Autoridade funcional por conexões

Este contrato fecha uma lacuna da matriz AETERNUM sem criar uma nova autoridade de execução.

## Regra

A autoridade funcional não é um ranking global fixo. Ela é uma composição de três camadas:

1. **Execução:** o `executionOwner` existente continua sendo quem executa.
2. **Governança:** `SARA` continua indicada apenas onde o descriptor já declara governança.
3. **Conexões:** dependências diretas e transitivas revelam os âncoras funcionais da arquitetura.

A conexão é medida sobre o grafo real de `AETERNUM_8_MODULES`. Uma dependência direta pesa mais do que uma dependência transitiva porque é uma relação estrutural imediata.

## Resultado na matriz atual

- `M1_CORE` é o âncora estrutural do grafo: não depende de outro módulo e é dependência de `M2_ORCHESTRATION` e `M5_PERCEPTION`, com efeitos transitivos nos ramos posteriores.
- `M2_ORCHESTRATION` funciona como mediador: depende de M1 e alimenta M3/M4/M6.
- `M6_IMMUNITY` mantém execução em N07 e governança em SARA, além de alimentar M7/M8.
- `M8_GOVERNANCE_MEMORY` mantém execução em N07; isso não transfere a memória do sistema para um novo núcleo e não substitui o HortaCore de N01.
- Os módulos M3/M4/M5 preservam seus donos nativos nos outros núcleos.

## NVOD / Vagus

O NVOD continua sendo o envelope de fusão interno de N01 e é mapeado para o Soul Mesh na fronteira. O resolvedor de autoridade não cria outro barramento, outro registry ou outro canal; ele apenas transforma a estrutura de conexões já existente em evidência operacional reutilizável.

## Prova

`scripts/n01-aeternum-functional-authority-check.mjs` executa contra os módulos reais do repositório. Falhas no grafo (ID duplicado, dependência desconhecida ou ciclo) fazem o processo falhar.

Estado: **estruturalmente implementado; execução CI depende do PR desta frente**.
