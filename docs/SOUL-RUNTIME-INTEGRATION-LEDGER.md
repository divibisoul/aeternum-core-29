# Soul Runtime Integration Ledger

Branch: `soul-reconstruction-2026-08-26`

## Rule
A runtime is not marked E2E-connected merely because source code or an endpoint exists. E2E requires request -> transport -> destination -> real handler -> correlated response.

## Runtime endpoints

| Nucleus | Runtime endpoint | Source evidence | Deployment state |
|---|---|---|---|
| N01 | Android/Hybrid Gateway | APK runtime | local integration |
| N02 | `/api/soul-mesh` | route exists | deployment/configuration required |
| N03 | `/api/soul-mesh` | `api/soul-mesh.ts` | deployment/configuration required |
| N04 | `/api/soul-mesh` | route exists | deployment/configuration required |
| N05 | `/api/soul-mesh` | route exists | deployment/configuration required |
| N06 | `/api/soul-mesh` | `api/soul-mesh.ts` | deployment/configuration required |

## Required proof for each directional channel

1. channel ID matches source/target;
2. transport is negotiated or selected;
3. request reaches destination;
4. destination executes the intended handler;
5. response carries the original correlation ID;
6. capability result is returned to N01/Pilot;
7. fallback is exercised only when the preferred transport fails.

## Capability ledger requirements

Every capability must map to owner nucleus, handler, AI dependency, supported transports, parallelism policy, and execution result semantics.

## Current conclusion
The six-runtime source topology is prepared, but deployment URLs and live runtime execution are external facts that cannot be fabricated by source changes. Until those facts are supplied by deployment, the ledger intentionally remains non-green.
