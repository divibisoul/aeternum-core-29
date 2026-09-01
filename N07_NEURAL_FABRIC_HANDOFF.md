# N07 Neural Fabric Handoff

N07 is the canonical orchestration/neural service. N01 retains ownership of Android/runtime capabilities; N07 provides shared neural, prefrontal, orchestration and distributed-compute services through Soul Mesh.

Current contract: `soul-mesh/1`, `1.1.0`; operations `neural.forward@1.0.0` and `neural.learn@1.0.0`.

Do not create a second N07 neural runtime. Before modifying the bridge, read N07 `main` and preserve `correlationId`, `traceId`, nonce/HMAC, bounded payloads, deadlines and explicit errors. N07 changes are concurrent with this repository; resolve SHA conflicts by rereading the newest file rather than overwriting.

WHAT_CHANGED: N07 neural federation expanded to all six nuclei; canonical numeric payload uses `payload.values`; versioned operation routing and federated execution are active in N07.
WHAT_REMAINS: exact-head CI and live bidirectional commissioning.
WHAT_NEXT_AGENT_SHOULD_DO: keep N01 bridge contract-compatible and test neural forward/learn against N07 when endpoints are available.
