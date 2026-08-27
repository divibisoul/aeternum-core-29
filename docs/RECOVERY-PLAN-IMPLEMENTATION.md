# Soul Mesh — Unified Recovery Plan Implementation

Status tracker for the fused recovery plan. This document is additive and does not invalidate existing implementations.

## Phase 0 — Governance
- [x] Canonical ownership document
- [x] Owner / fallback / consumer semantics
- [ ] Shared `@soul-mesh/contracts` package across repositories

## Phase 1 — Hybrid service discovery
- [ ] N01 registration endpoint
- [ ] Persistent registry (Supabase/Redis adapter)
- [ ] Registration client in N02–N06
- [ ] Static `.env.mesh` fallback
- [ ] Periodic peer health refresh

## Phase 2 — Capability exposure
- [ ] N03 perception exposer wired to real handlers
- [x] N06 canonical facade introduced while retaining legacy compatibility
- [ ] N06 all legacy references isolated behind compatibility layer

## Phase 3 — Delegation
- [ ] Shared capability metadata schema
- [ ] Owner resolution
- [ ] Fallback resolution
- [ ] Consumer/remote execution policy
- [ ] Local-handler optimization without changing ownership

## Phase 4 — E2E cognitive test
- [ ] N01 → N03 perception
- [ ] N03 → N01 result
- [ ] N01 → N02 reasoning
- [ ] N02 → N04 document creation
- [ ] N04 → N02 confirmation
- [ ] N02 → N01 final result
- [ ] CI execution

## Phase 5 — Resilience / observability
- [ ] Heartbeat
- [ ] Peer expiry/reconnect
- [ ] Correlation ID propagation
- [ ] Structured request logs
- [ ] Retry/backoff
- [ ] Circuit breaker

## Phase 6 — Security
- [ ] Configurable TLS
- [ ] JWT or mTLS handshake

## Phase 7 — Documentation
- [ ] ADRs
- [ ] Sequence diagrams
- [ ] README synchronization

## Acceptance rule
A channel is not marked verified merely because its route, ping, health, or protocol exists. Verification requires a real transport transaction, destination handler execution, correlated response, and observable result.
