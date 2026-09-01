# N01↔N06 Capability Compatibility Matrix

This matrix describes the current executable capability vocabulary, not historical names. A row is design-level until a real transaction reaches the owning runtime and returns a correlated result.

| Direction | Capability | Owner | Consumer | Context | Result |
|---|---|---|---|---|---|
| N01→N06 | support.ai-pilot | N06 | N01 / Mesh peers | prompt + optional system context | N06 AI-pilot result |
| N01→N06 | support.context | N06 | N01 / Mesh peers | selected context + metadata | contextual support result |
| N01→N06 | support.tool-execution | N06 | N01 / Mesh peers | authorized user/tool context | native tool result |
| N01→N06 | support.artifacts | N06 | N01 / Mesh peers | authorized user/data stream | artifact operation result |
| N01→N06 | support.documents | N06 | N01 / Mesh peers | authorized user/data stream | document operation result |
| N01→N06 | support.streaming | N06 | N01 / Mesh peers | stream-capable request context | streaming result/events |
| N01→N06 | support.mesh | N06 | N01 / Mesh peers | canonical Mesh request | correlated Mesh result |
| N06→N01 | android.device_info | N01 | N06 / Mesh peers | authorized device scope | device state |
| N06→N01 | android.battery | N01 | N06 / Mesh peers | authorized device scope | battery state |
| N06→N01 | android.memory | N01 | N06 / Mesh peers | authorized device scope | memory state |
| N06→N01 | android.network | N01 | N06 / Mesh peers | authorized device scope | network state |
| N06→N01 | android.events | N01 | N06 / Mesh peers | authorized event scope | event data |

## Verification state
No row is marked VERIFIED by ping/health alone. A row becomes VERIFIED only when an executable capability reaches its owning runtime and returns the original correlation identity through the canonical Mesh contract.

## Composition target before N07
The pre-N07 fusion scenario must compose at least one N06 native capability with one N01 native capability in one transaction chain, preserving ownership, authorization, correlation and failure isolation.

## Final N07 handoff
N07 will consume the stabilized N01↔N06 capability graph, not a duplicate copy. The final N07 stage may compose capabilities across N01 and N06 and add N07-native neural/compute orchestration, while keeping each owning runtime independent.
