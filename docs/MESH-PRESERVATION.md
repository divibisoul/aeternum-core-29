# Inter-Core Mesh Preservation

The fusion MUST preserve any existing communication path between the six repositories.

## Requirement

Communication is treated as bidirectional wherever the existing implementation supports it:

`Core A <-> Core B`

not merely:

`Core A -> Core B`

## Non-destructive rule

Before replacing, removing, or consolidating any transport, event bus, health endpoint, bridge, adapter, webhook, WebSocket, API route, IPC path, or mesh registration, audit its callers and receivers.

If an existing mechanism provides useful communication, preserve it and migrate it behind the canonical Soul Protocol rather than deleting it.

## Target

The final system should expose explicit contracts for:

- identity
- capability registration
- health
- event publication
- event subscription
- request/response
- bidirectional command/acknowledgement where authorized
- version/compatibility

## Directionality

For each discovered connection record:

- source
- destination
- transport
- protocol/schema
- authentication/authorization
- event types
- request types
- response/acknowledgement
- health mechanism
- current status
- migration target

## Priority

1. Preserve working paths.
2. Make hidden/implicit paths explicit.
3. Add missing reverse paths only where architecturally justified.
4. Never create feedback loops accidentally.
5. Never remove a path solely because it appears redundant until dependency analysis proves it redundant.
