# N01 Mesh Foundation v1

## Scope

This branch implements the first N01 communication-foundation layer without deleting existing files or changing the core AI pipeline.

## Implemented

- Canonical mesh foundation types under `src/core/mesh/types/`.
- Durable browser discovery through IndexedDB plus an in-memory hot cache.
- Startup hydration through `SoulMeshDiscoveryRuntime`.
- Unified N01 peer-registry facade.
- Remote capability snapshots with ownership validation.
- Optional peer authentication metadata and a constant-time token comparison helper.
- HTTP bearer-token support and exponential retry backoff with jitter.
- Canonical N01 identity in the live runtime; the legacy `aeternum` identity is no longer used by that runtime.
- N01 `mesh.echo` executable handler.
- Five-peer diagnostic over the same Supabase Realtime transport used by N01.

## Important architectural constraint

N01 is a browser/Vite runtime. A browser-exposed `VITE_*` variable is not a safe location for a shared secret. The auth helper therefore requires the secret to arrive from a trusted runtime boundary and does not persist it. Full server-side inbound HTTP authentication is a later ingress concern and is not simulated here.

## Verification semantics

The five-peer diagnostic reports a peer as `PASS` only after a response is received with the expected source, target and correlation identifier. An unimplemented `mesh.echo` handler on a remote nucleus is therefore a real failure, not a success disguised by topology configuration.

The repository's existing 60-channel matrix remains the architectural source for expected functional affinity. Static topology is not treated as runtime proof.

## Remaining work for the next floor

1. Make N02–N06 advertise and execute a common diagnostic capability such as `mesh.echo`.
2. Reconcile the remaining duplicate/legacy mesh contract implementations across the six repositories.
3. Establish the actual five-input/five-output capability mapping for each nucleus from their audited functions and tools.
4. Only after those pieces are verified, introduce the cross-repository canonical contracts package and then proceed to parallel fan-out.
