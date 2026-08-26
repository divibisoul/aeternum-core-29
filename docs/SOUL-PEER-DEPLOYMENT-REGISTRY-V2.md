# SOUL Peer Deployment Registry v2

This registry deliberately separates known code contracts from verified reachable deployment endpoints.

| Nucleus | Logical identity | Endpoint evidence | Live connectivity status |
|---|---|---|---|
| N01 | N01 | Android/Web host in this repository | LOCAL HOST; cross-peer E2E pending |
| N02 | N02 | Mesh contract present in N02 branch | UNVERIFIED |
| N03 | N03 | Mesh contract present in N03 branch | UNVERIFIED |
| N04 | N04 | Mesh contract present in N04 branch | UNVERIFIED |
| N05 | N05 | Next.js `app/api/soul-mesh/route.ts` is present | ROUTE EXISTS; live cross-runtime execution UNVERIFIED |
| N06 | N06 | Mesh contract/adapter present in N06 branch | UNVERIFIED |

## Important
A source file, route declaration, health flag, peer matrix, or endpoint string is not proof of network reachability.

## Verification gate
For every directed channel, the verification harness must prove:
1. source emits a real request;
2. selected transport carries it;
3. destination receives it;
4. destination resolves the requested capability;
5. real handler executes;
6. response correlation matches the request;
7. observable result is returned to the source.

Until all seven are observed, status remains UNVERIFIED.

## N01 gateway requirement
The APK gateway may expose all capabilities through one user-facing surface, but it must route to the actual owning nucleus and must never manufacture a successful result when the owning runtime is unavailable.
