# N01 Capability Inventory — Live GitHub State

Source branch: `upgrade/soul-n01-etapa2-v1`

## Verified capabilities

### chat-engine
- Module: `src/capabilities/chat-engine/index.ts`
- Runtime component: `ChatEngine.tsx`
- Declared purpose: multi-persona AI chat with orchestration.
- Permissions: `chat:send`, `chat:history`.
- Mount validation: invokes `validateCapabilityGraph()`.

### settings
- Module: `src/capabilities/settings/index.ts`
- Runtime component: `Settings.tsx`
- Declared purpose: system configuration and API key management.
- Permissions: `settings:read`, `settings:write`.

## Fusion interpretation

N01 currently exposes two repository-verified capability modules. They must not be treated as equivalent to the full six-nucleus capability inventory: N02–N06 inventories must be sourced from their own repositories before cross-nucleus fusion is declared executable.

Potential N01 composition candidates to investigate against peer capabilities:

- `chat-engine` × peer reasoning/analysis capabilities → delegated multi-agent analysis.
- `chat-engine` × peer tool/execution capabilities → agent-mediated tool orchestration.
- `settings` × peer configuration/discovery capabilities → controlled runtime configuration federation.
- `chat-engine` × `settings` → local orchestration with explicit configuration boundaries.

## Closure rule

A candidate becomes an implemented emergent capability only after a real contract, handler, Mesh route, execution path and validation evidence exist. This inventory records verified source facts and hypotheses separately so the fusion layer cannot manufacture capabilities from labels alone.
