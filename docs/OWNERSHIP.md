# Soul Capability Ownership

Canonical ownership registry for the seven independent Soul nuclei.

| Family | Owner | Fallback | Primary consumers |
|---|---|---|---|
| `android.*` | N01 | N06 | N02,N03,N05,N06,N07 |
| `conversation.*` | N02 | N04,N05 | N01,N03,N04,N05,N06,N07 |
| `perception.*` | N03 | N01 | N01,N02,N04,N05,N06,N07 |
| `document.*` | N04 | N06 | N01,N02,N03,N05,N06,N07 |
| `inference.*` | N05 | N02,N06 | N01,N02,N03,N04,N06,N07 |
| `cognitive.*` | N06 | N05,N02 | N01,N02,N03,N04,N05,N07 |
| `mesh.*` | N01 | N06 | N02,N03,N04,N05,N06,N07 |

## Execution rule

`owner` is authoritative for remote execution. A nucleus may retain a local handler as an optimization/fallback, but local declaration does not change ownership. The router must distinguish `declared`, `executable`, `owner`, `consumer`, and `fallback`.

## Compatibility

This document is additive. Existing handlers, transports and legacy names remain valid until explicitly migrated.
