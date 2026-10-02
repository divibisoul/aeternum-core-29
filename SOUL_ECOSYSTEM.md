# SOUL Ecosystem

**SOUL component:** N01 — coordenação, estado, identidade e memória

This repository is a public component of the **SOUL ecosystem**. External open-source projects are attached by functional similarity and preserved as upstream dependencies; their source ownership remains with their original maintainers.

## Attached upstream capabilities

- **langgraph** — https://github.com/langchain-ai/langgraph.git — pinned at `157a06dda988d85afeb8751ff27b35ab3f4f8bf4`
- **letta-code** — https://github.com/letta-ai/letta-code.git — pinned at `1fcc9666817ab852bc2532a3a989f712e1fd6c19`
- **pydantic-ai** — https://github.com/pydantic/pydantic-ai.git — pinned at `6bc07cf18b0641ea92343d8c589cfb922108b802`

## SOUL system

- N01: https://github.com/divibisoul/aeternum-core-29
- N02: https://github.com/divibisoul/Eternium-
- N03: https://github.com/divibisoul/nexus-aeternum-fusion
- N04: https://github.com/divibisoul/nextjs-ai-chatbots
- N05: https://github.com/divibisoul/nextjs-ai-chatbot
- N06: https://github.com/divibisoul/nextjs-ai-chatbot-2000
- N07: https://github.com/divibisoul/Orquestrador-
- SARA: https://github.com/divibisoul/SARA
- Jev API: https://github.com/divibisoul/jev-api

See N07 for the canonical external capability manifest: https://github.com/divibisoul/Orquestrador-/blob/main/integrations/external-capabilities.json

## Functional integration boundary

The binding contract for this component is recorded in `integrations/capability-boundary.json`. It states why each upstream capability is present, the canonical routing boundary, the engineering agent responsible, and the evidence gate before runtime activation.

## Runtime truth

Submodule presence is structural integration. Runtime activation is not asserted unless the corresponding adapter, configuration, and end-to-end tests exist and pass.
