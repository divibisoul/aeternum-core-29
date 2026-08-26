# N01↔N06 Capability Compatibility Matrix

| Direction | Capability | Owner | Remote consumer | Context | Result |
|---|---|---|---|---|---|
| N01→N06 | ai.reasoning | N06 | N01 | permitted request context | structured reasoning result |
| N01→N06 | conversation | N06 | N01 | conversation context | assistant result |
| N01→N06 | tools.describe | N06 | N01 | none/minimal | tool metadata |
| N01→N06 | context.orchestration | N06 | N01 | selected context | synthesized context |
| N06→N01 | android.device_info | N01 | N06 | authorized device scope | device state |
| N06→N01 | android.battery | N01 | N06 | authorized device scope | battery state |
| N06→N01 | android.memory | N01 | N06 | authorized device scope | memory state |
| N06→N01 | android.network | N01 | N06 | authorized device scope | network state |
| N06→N01 | android.events | N01 | N06 | authorized event scope | event data |

## Proof requirement
Every row is a design-level compatibility path until a real transaction reaches the owning runtime and returns a correlated result. No ping/health result upgrades a row to VERIFIED.

## Composition target
The first fusion scenario should compose at least one N06 cognitive capability and one N01 Android capability in a single transaction chain, with explicit context propagation and independently owned execution.
