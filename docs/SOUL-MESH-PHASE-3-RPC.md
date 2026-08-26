# Soul Mesh — Phase 3 RPC

The HTTP transport is the communication medium between nuclei. Phase 3 defines the reliable request/response layer above that transport.

## Flow

`request -> ACK -> response/error`

The same `correlationId` MUST identify all messages belonging to one request transaction.

## Requirements

- register pending requests by correlationId;
- reject orphan ACK/response/error messages;
- configurable timeout;
- bounded retry policy;
- no retry after a confirmed ACK unless the operation is explicitly idempotent;
- propagate structured errors;
- remove completed/expired correlation entries;
- expose transport failures to health monitoring;
- preserve the canonical Mesh contract.

## Architectural rule

HTTP is only the current transport. RPC depends on the canonical Mesh contract, not on HTTP, so another transport can be introduced without changing nucleus capabilities.

## Connection model

Each nucleus exposes one logical Mesh endpoint and consumes other nuclei through the same contract. For six nuclei, the full peer graph contains 15 bidirectional pairs / 30 directed links, while the per-nucleus interface remains 5 IN + 5 OUT.

## Completion criterion

Phase 3 is complete only when automated tests demonstrate:

1. request reaches receiver;
2. receiver returns ACK with matching correlationId;
3. receiver returns response with matching correlationId;
4. timeout is detected;
5. orphan response is rejected;
6. transport error becomes an RPC error;
7. completed correlation state is removed.
