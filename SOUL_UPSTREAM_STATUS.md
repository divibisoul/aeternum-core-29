# N01 — Public upstream integration status
**Snapshot:** 2026-10-25 · **Inspected N01 main:** `da36c41e080c7662b9c2db903c26795053df20eb`  
**Audit branch:** `audit/ai-nucleus-status-2026-10-25`

## Sources pinned

| Public source | Pinned SHA | Intended augmentation | State |
|---|---|---|---|
| [LangGraph](https://github.com/langchain-ai/langgraph) | `157a06dda988d85afeb8751ff27b35ab3f4f8bf4` | Stateful capability workflows | SOURCE_PINNED; no N01-specific E2E proof |
| [Letta Code](https://github.com/letta-ai/letta-code) | `1fcc9666817ab852bc2532a3a989f712e1fd6c19` | Persistent agent state and identity/memory assistance | SOURCE_PINNED; CLI/runtime and actual persistence not proven |
| [Pydantic AI](https://github.com/pydantic/pydantic-ai) | `6bc07cf18b0641ea92343d8c589cfb922108b802` | Typed agent/tool boundary | SOURCE_PINNED; adapter-live not proven |

N01 `.gitmodules` places these under `integrations/soul-upstream/*`; its `integrations/capability-boundary.json` routes execution through the existing N01/Clareira/SuperGPU/Mesh boundary and explicitly states runtime `PROJECTED`.

## Findings and next action

- Preserve N01's native Gemini intent path, memory context, correlation and separate Node gateway / TypeScript Mesh contract. Upstream frameworks augment that logic; they do not replace it.
- A public source pin alone does not prove an adapter uses code at that SHA. Letta Code requires checking the CLI being invoked; Pydantic AI needs a pinned package/environment and typed output validation.
- LangGraph should use SOUL's bounded task model and N07 execution authority; it must not create a second router or claim success if it only echoes input.
- The N01 public upstream boundary has structural intent, but no live authenticated provider-to-upstream-to-Mesh transaction was executed in this audit.

**Gate:** `ADAPTER_PLANNED / RUNTIME_UNVERIFIED`; exact-head CI is not considered green unless a run is attached to the current SHA.
