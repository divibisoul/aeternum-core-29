# ADR-001 — Hybrid Soul Mesh Service Discovery

## Decision
N01 is the primary logical registry (cognitive DNS), while persistent storage may be supplied by Supabase/Redis. Every N02–N06 instance can register its physical endpoint and capabilities. Nodes may resolve peers through N01 or a direct persistence adapter.

## Fallback
Development and recovery environments may use `SOUL_MESH_PEERS` / `.env.mesh` static mappings. Static mappings never override a fresh registered endpoint.

## Constraints
- No repository merge.
- No transport replacement.
- Existing Mesh routes remain valid.
- Discovery does not imply capability ownership.
- A peer is usable only after health/handshake succeeds.
