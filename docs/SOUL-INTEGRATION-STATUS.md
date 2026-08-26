# SOUL Integration Status — 2026-08-26

## Verified repository-level changes on `soul-reconstruction-2026-08-26`

- Canonical nucleus IDs are N01..N06 in the N01 TypeScript Mesh protocol.
- N01 peer endpoint names are canonicalized to N02..N06.
- N01 has a transport-neutral hybrid channel contract.
- N01 has a universal capability gateway abstraction for user-facing APK access to capabilities owned by any nucleus.
- N01 Android runtime has a local-first / remote-fallback Mesh path.
- N01 Android configuration now supports explicit N02-N06 remote endpoint configuration; empty configuration is treated as unavailable, not as connected.
- N01 has a 60-channel Kotlin topology model and tests for exactly 5 IN + 5 OUT per nucleus.
- N01 has a supervisory Pilot Cockpit state model whose initial channel state is UNVERIFIED.
- N02, N03, N04, N05 and N06 have transport-neutral hybrid channel contracts.
- N06 TypeScript Mesh protocol and peer endpoints are canonicalized to N01..N06.

## Important non-claims

These changes do NOT claim that the six deployed runtimes are already live-connected. The repositories do not provide evidence of six deployed endpoints or a successful end-to-end exchange across all 60 channels.

They establish the common contract and the APK-side hybrid routing machinery needed to make that connectivity testable.

## Next verification gates

1. Inventory every capability in all six repositories and assign one canonical owner.
2. Replace any remaining legacy nucleus identifiers in executable code.
3. Bind every real capability handler to the canonical registry.
4. Connect N01's Web Session/Pilot completion path to asynchronous Mesh correlation.
5. Replace provider-specific AI calls at capability boundaries with the provider-neutral Web Session boundary where technically possible.
6. Configure actual N02-N06 runtime endpoints without inventing URLs.
7. Run true E2E request -> transport -> target -> handler -> correlated response tests.
8. Mark each of the 60 directional channels only from live evidence.
