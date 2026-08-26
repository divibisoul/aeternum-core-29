# Soul Mesh — Communication implementation baseline

This document records the implemented communication boundary and the work still required for end-to-end proof.

## Implemented in N01

- canonical `soul-mesh/1` contract validation;
- `SoulMeshMessage` envelope;
- HTTP transport;
- runtime `SoulMeshEndpoint`;
- capability dispatch;
- RPC correlation/timeout layer;
- Android Internet permission.

## Runtime communication model

`Nucleus -> Router -> Transport -> Target Endpoint -> Validator -> Capability Handler -> Response -> Router -> Source RPC`

HTTP is currently the concrete transport. The contract/RPC layers are transport-independent.

## Critical limitation

Adding these components to N01 does not by itself connect N02–N06. Each target nucleus must implement/adapt the same endpoint contract and expose a real runtime receiver. Until that is done and exercised, the link is not CONNECTED.

## Completion gate

Communication infrastructure is complete only after:

1. N01 and N02 both run compatible endpoints;
2. N01 sends a real request to N02;
3. N02 validates and dispatches it;
4. N02 returns ACK and response;
5. N01 correlates the response;
6. timeout/orphan/error paths pass tests;
7. the same adapter pattern is installed and verified for N03–N06;
8. all 15 bidirectional peer pairs pass the connection proof.

No repository directory merge is required. The final APK integrates the runtime modules into one Soul application.
