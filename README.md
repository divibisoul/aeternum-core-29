# N01 — Soul Mesh Host / Android AGI Core

This repository is the canonical N01 runtime of the SISTEMA SOUL. N01 remains an independent runtime and owns its native Android/Sentinel capabilities. Soul Mesh provides interoperable transport, discovery, capability advertisement, authentication, correlation and delegation without transferring ownership between nuclei.

## Canonical N01 architecture

- **Core / Event Bus:** existing N01 runtime and internal event coordination.
- **Mesh:** one canonical Soul Mesh contract with N01 as host/reference gateway.
- **Transport:** `HybridTransportRegistry` is the single transport authority; `CanonicalTransportAdapter` validates the existing envelope and delegates transport selection to that registry.
- **Capabilities:** `CapabilityGraph` remains the native source of truth; `N01CapabilityBridge` exposes those capabilities through the existing Mesh contract without creating a second capability registry.
- **Discovery:** peer endpoints and capability snapshots remain owned by the existing N01 discovery/registry stack.
- **Integrity:** HMAC/correlation, bounded routing, replay/timestamp validation and executable contract checks remain part of the validation boundary.
- **Sentinel:** the Android `SoulAdminService` is the N01 watchdog. It is enabled by default, starts with the hybrid runtime and after boot/package replacement, records Core/Mesh metrics and performs a bounded self-restart after repeated monitor failures.
- **Fast inference:** N01 only expresses routing priority; accelerated provider ownership remains with the nuclei that implement it.

## Seven-nucleus Mesh topology

N01 recognizes the seven-nucleus topology `N01..N07`. Each nucleus has six peer directions, producing **42 directed links** and **21 bidirectional peer pairs**. The number 84 refers only to counting inbound and outbound channel endpoints separately and is not the directional-link count.

## Executable validation

```sh
npm run build
npm run lint
npm run test:soul-transport
npm run mesh:health:unit
npm run mesh:async:unit
npm run mesh:contract:check
npm run fusion:check
npm run byok:check
npm run vector-memory:check
```

The N01 validation workflow is the machine-execution boundary. A green claim is made only from an actual GitHub Actions run; source-level assertions and documentation are not substituted for runtime evidence.

## Mesh endpoints

- `GET /mesh/health`
- `GET /mesh/discovery`
- `POST /mesh/register`
- `POST /mesh/in`
- `POST /mesh/out`
- `POST /api/soul-mesh`

Configure peer endpoints with the existing `SOUL_MESH_N02_URL` through `SOUL_MESH_N07_URL` deployment variables. HMAC material remains server-side; never commit real secrets.

## Consolidation policy

N01 consolidation preserves historical branches and commits. The canonical execution line is this repository's `consolidacao-n01` branch until its single consolidation PR is merged into `main`. Historical PRs are classified by functional overlap: absorbed work is represented in the canonical line; complementary work is integrated only when it strengthens an existing authority; redundant/historical PRs are closed with their branches preserved.

### Current consolidation decisions

- **#15 — canonical cumulative foundation:** absorbed. Its canonical transport adapter, executable transport contract and capability bridge are now part of the N01 line.
- **#24 — environment/CI hardening line:** absorbed selectively. Its useful seven-nucleus contract corrections and diagnostics direction are integrated without adding duplicate validation workflows; its incorrect `84` directional-link interpretation is corrected to `42`.
- **#20 — Groq/fast-inference routing:** absorbed into the existing neural routing model. N01 routes; it does not own another nucleus's provider SDK.
- **#18 — environment hardening:** already present on `main`; no duplicate implementation was created.
- **#21 — live Google API check:** retained as historical evidence rather than adding a second provider-validation path; the existing BYOK behavioral check remains canonical.
- **#19 — hybrid Supabase/IPFS storage:** not duplicated inside N01. N01 already owns vector memory and Mesh job persistence, while artifact/storage ownership belongs to the existing system storage authorities; the historical implementation remains preserved on its branch.
- **#7/#8/#9 — Mesh foundations:** their useful contract, discovery and diagnostic concepts are already represented by the current canonical Mesh stack; no second Mesh fabric is created.
- **#6/#4 — peer/integration architecture:** preserved as historical compatibility evidence and reconciled through the current canonical registry/router rather than a second peer registry.
- **#1/#2 — original Sentinel foundation/JVM correction:** already present in the Android Sentinel tree; the current line hardens and activates that implementation rather than replacing it.

No historical branch is deleted as part of this consolidation.
