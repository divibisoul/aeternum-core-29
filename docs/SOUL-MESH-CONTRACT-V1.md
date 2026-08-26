# Soul Mesh Contract v1

## Status
Phase 1 of `SOUL-MESH-BUILD-PLAN.md`.

## Canonical message
Every inter-nucleus message MUST contain:

- `protocol`: `soul-mesh/1`
- `id`: unique message identifier
- `correlationId`: identifier shared by a request and its response/ACK
- `source`: sending nucleus ID (`N01`..`N06`)
- `target`: receiving nucleus ID (`N01`..`N06`)
- `kind`: `request | response | event | error | ack`
- `capability`: canonical capability identifier
- `payload`: JSON-serializable data
- `timestamp`: UTC ISO-8601 timestamp

## Semantics

### request
Starts an operation. A request MUST receive either an `ack` and eventual `response`, or an `error`.

### ack
Confirms receipt/acceptance of a request. ACK MUST preserve the request `correlationId`.

### response
Carries the successful result and MUST preserve the request `correlationId`.

### error
Carries a machine-readable error and MUST preserve the request `correlationId` when responding to a request.

### event
One-way notification. Events do not require a response.

## Validation rules

1. `source` and `target` MUST be known nucleus IDs.
2. `source` MUST NOT equal `target` for inter-nucleus traffic.
3. `id` and `correlationId` MUST be non-empty.
4. `capability` MUST be non-empty for request/response/ack/error.
5. `payload` MUST be JSON-serializable.
6. Unknown `kind` values MUST be rejected.
7. Malformed messages MUST never be dispatched to a capability handler.
8. A response/ack/error without a matching correlation MUST be treated as an orphan and rejected/logged.
9. The receiver MUST validate the message before execution.

## Nucleus IDs

- `N01` — Android / Sentinel
- `N02` — AI tools / chat
- `N03` — Nexus / specialized knowledge
- `N04` — AI/chat capabilities
- `N05` — AI/tools/mesh capabilities
- `N06` — integral support: context/documents/artifacts/tools/communication

## Capability naming

Use stable dotted names, for example:

- `android.battery.read`
- `document.create`
- `document.update`
- `document.suggestions`
- `environment.weather.read`
- `context.read`

The nucleus that owns a capability is its single authoritative implementation. Other nuclei consume it through Mesh rather than duplicating it.

## Connection proof
A route is NOT `CONNECTED` because it appears in a peer matrix. It becomes `CONNECTED` only after:

`discovery → handshake → validation → authorization → ping → request → ACK → response → correlation check → health`

## Compatibility
Version 1 is intentionally transport-agnostic. HTTP is one possible transport; the contract must not depend on HTTP-specific behavior.
