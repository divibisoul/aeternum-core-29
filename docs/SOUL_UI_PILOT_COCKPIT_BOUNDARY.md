# Soul — separação arquitetural: Interface, Pilot e Cockpit

## Regra arquitetural

A interface do APK, o Pilot e o Cockpit são componentes distintos. Eles podem trocar estado e comandos, mas não devem ser tratados como a mesma camada.

### Interface do APK

É a camada de interação com o usuário final. Ela oferece chat, navegador/WebView, sessões de IA, câmera, microfone, arquivos, mídia e acesso às capacidades disponíveis do dispositivo.

### Pilot

É a camada de orquestração. Recebe a intenção/tarefa, seleciona capabilities, decide a sequência de execução e coordena IA providers e núcleos através do Soul Mesh.

### Cockpit

É o centro operacional/observabilidade do Soul. Deve visualizar e administrar o estado do sistema: núcleos, capabilities, rotas, conexões, sessões de IA, tarefas, transporte, execução, resultados, erros e métricas de sinergia.

O Cockpit não é a interface conversacional e não substitui o Pilot.

## Fluxo

`Usuário → Interface → Pilot → Capability Registry → Soul Mesh/Núcleo → resultado → Interface`

O Cockpit observa e administra a operação paralelamente:

`Pilot ↔ Cockpit`

## Regra para o N01

- Não transformar a tela do APK em Cockpit.
- Não colocar lógica de orquestração do Pilot dentro dos componentes visuais.
- Não considerar um botão “Cockpit” como prova de que o Cockpit operacional está implementado.
- A interface pode exibir estados produzidos pelo Cockpit, mas permanece uma camada separada.
- O mesmo princípio vale para a interface do usuário, o Pilot e os seis núcleos.
