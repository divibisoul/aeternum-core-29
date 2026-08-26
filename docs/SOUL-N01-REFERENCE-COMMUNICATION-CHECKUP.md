# N01 Reference Communication Check-up

## Principle
N01 is the reference for communication semantics, not because it owns every capability, but because its hybrid host already separates logical channel identity from transport.

## Supported transport classes
- IN_PROCESS
- WEBVIEW_BRIDGE
- LOOPBACK_HTTP
- HTTP
- REALTIME

## Communication layers
1. Logical nucleus channel (N01..N06)
2. Transport negotiation
3. Mesh envelope
4. RPC transaction
5. Capability discovery
6. Authorization
7. Context exchange
8. Tool discovery/execution
9. Structured result/error
10. Observability

## AI-to-AI proof
A functional connection requires a real capability transaction. Ping, health, route existence and adapter presence are diagnostic/structural evidence only.

## Reference transaction
`discover -> negotiate -> authorize -> request capability -> execute real handler -> correlated result`

## Bidirectional requirement
For a pair to be VERIFIED, both directions must be exercised with real capabilities. For N01↔N06 the reference set is:
- N01 -> N06: ai.reasoning, conversation, tools.describe, context.orchestration
- N06 -> N01: android.device_info, android.battery, android.memory, android.network, android.events

## Context contract
Context must be explicit and scoped. A nucleus never receives another nucleus's private session credentials merely because it can invoke a capability.

## Tool contract
Tools are capabilities with execution authority. Discovery may expose metadata; execution remains owned and authorized by the provider nucleus.

## Transport compatibility
The same logical request/response envelope must be usable over every negotiated transport. No nucleus capability may depend on HTTP-specific semantics.

## Failure semantics
Timeout, unsupported capability, unauthorized request, transport failure, malformed envelope, correlation mismatch and handler failure are explicit non-success states.

## Current N01↔N06 status
The compatibility design is implemented/documented, but the pair must not be marked VERIFIED until real bidirectional capability transactions are executed against live runtimes.
