# Soul Repository Union

This is the canonical super-system for the six historical Soul repositories.

The canonical executable is `soul-sentinel`. The other repositories are pinned capability/provider sources and are assembled by the unified build.

## Components
- aeternum-core-29 — canonical core/orchestration
- nexus-aeternum-fusion — multimodal/UI services
- Eternium- — Gemini/AI orchestration
- nextjs-ai-chatbot — canonical conversation provider
- nextjs-ai-chatbot-2000 — legacy variant retained for migration/audit
- nextjs-ai-chatbots — legacy variant retained for migration/audit

## Completion criterion for this stage
The six repositories must be checked out together from pinned revisions by one build, with a single executable Android boundary. Runtime provider adapters remain a separate stage and are not claimed complete until they are exercised by integration tests.
