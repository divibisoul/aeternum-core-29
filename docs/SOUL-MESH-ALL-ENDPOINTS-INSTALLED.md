# Soul Mesh — All six runtime endpoint adapters

The common runtime endpoint adapter has now been installed in N01-N06 source repositories.

N01: native Kotlin endpoint in aeternum-core-29.
N02: TypeScript endpoint in nextjs-ai-chatbots.
N03: TypeScript endpoint in nexus-aeternum-fusion.
N04: TypeScript endpoint in nextjs-ai-chatbot.
N05: TypeScript endpoint in nextjs-ai-chatbot-2000.
N06: TypeScript endpoint in Eternium-.

All adapters implement the same logical contract: protocol identity, target validation, correlation fields, capability dispatch, response and error.

This completes endpoint installation. It does NOT by itself prove 30 live links; live proof requires executing requests through each runtime transport.
