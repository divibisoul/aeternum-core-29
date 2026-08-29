# SOUL Mesh — N01 Integration Status

## Canonical role

N01 is the coordination/registry nucleus. It does not replace the specialized AI runtimes of N02–N06. It discovers peers, validates Mesh envelopes, delegates owned capabilities, and orchestrates multi-step combinations.

## Implemented in this repository

- `lib/soul-mesh/SoulMeshEnvelope.ts`: canonical envelope, correlation ID, nonce, timestamp, HMAC and replay validation.
- `lib/soul-mesh/SoulHybridBridge.ts`: existing browser/native bidirectional bridge preserved.
- `scripts/soul-mesh-server.mjs`: executable N01 HTTP Mesh gateway.
- `scripts/test-n01-n06.mjs`: N01 health and N01→N06 E2E probe.

## N01 Mesh endpoints

- `GET /mesh/health`
- `GET /mesh/discovery`
- `POST /mesh/register`
- `POST /mesh/in`
- `POST /mesh/out`

## Delegation model

- `inference.*` → N05
- `conversation.*` → N05
- `document.*` → N04
- `audio.*` → N03
- `tool.*` → N04

The router forwards the original correlation ID and changes source/target to represent the current hop.

## Combination model

`mesh.combo` accepts an ordered list of `{ target, capability }` steps and passes each step's result to the next nucleus. Every hop receives a fresh message ID while preserving the originating correlation ID.

## Resilience

- 30-second peer timeout
- exponential circuit isolation after 5 failures
- 60-second circuit-open interval
- nonce replay protection
- timestamp skew validation
- payload limit of 2 MB
- optional HMAC-SHA256 via `SOUL_MESH_SECRET`

## Runtime truth

Code deployment is verified in GitHub. Live N01↔N06 traffic is only considered proven when `npm run mesh:health` executes with both runtimes available and reports `N01_N06_E2E: ok=true`.

No HTTP 200, file presence, or static configuration is treated as proof of an operational cognitive connection.
