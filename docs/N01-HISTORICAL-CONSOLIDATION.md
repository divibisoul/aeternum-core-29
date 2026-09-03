# N01 — Historical Consolidation

## Purpose

This record is the continuity ledger for N01. It reconciles the thirteen open PR lines identified in the 03/09/2026 audit without deleting their history. GitHub implementation state is authoritative; prior conversation claims are not treated as execution evidence.

## Canonical authority

The N01 consolidation line is `consolidacao-n01`, built from the cumulative #15 → #24 lineage and the complementary fragments below. No third parallel implementation is created for an existing responsibility.

## PR classification and treatment

| PR | Classification | Treatment |
|---|---|---|
| #15 | Canonical / already absorbed | Base of the N01 consolidation line. |
| #24 | Complementary | Environment/runner/audit improvements are reconciled into the canonical line; duplicate workflows are not copied blindly. |
| #21 | Already absorbed | Environment/CI capability is represented by the canonical validation and diagnostic gates. |
| #20 | Already absorbed | Groq/fast-inference routing is present in the canonical neural graph and fusion layer. |
| #19 | Already absorbed | Hybrid storage remains in the canonical storage implementation; the weaker public-key fallback is not preferred over the canonical secure path. |
| #18 | Already absorbed | Mesh configuration is represented by the canonical peer/environment configuration. |
| #9 | Already absorbed | Mesh resilience/health/telemetry are present in the canonical Mesh stack. |
| #8 | Complementary | Its 5×5 diagnostic intent is preserved as the canonical `mesh:diagnose` structural gate, corrected for the current seven-nucleus topology. |
| #7 | Already absorbed | Mesh foundation is represented by the canonical Mesh runtime and contracts. |
| #6 | Already absorbed | N04 communication architecture is represented through the generic capability/transport contract rather than a second N04-specific authority. |
| #4 | Already absorbed | N01↔N02 hybrid link and multiplexed transport remain in the canonical Mesh implementation. |
| #1 | Historical / already superseded | Original Sentinel foundation is preserved through the current `SoulAdminService`/`SoulCortex` implementation. |
| #2 | Historical / already superseded | Earlier Sentinel evolution is preserved through the current watchdog implementation and tests. |

Branches and PR history are preserved. Closing a historical/redundant PR is an administrative consolidation step, not deletion of its branch or commits.

## Preserved architecture

N01 remains the Android/APK communication reference and does not take ownership of capabilities belonging to other nuclei. Existing WebView/Android bridge, in-process routing, HTTP transport, inbound listener, RPC correlation, peer configuration, capability registry/discovery, health/handshake, channel model and Supabase-related components remain preserved.

## Cross-language wire contract

The canonical Mesh protocol is `soul-mesh/1`, contract version `1.1.0`, with nucleus IDs N01–N07. Six peers connected to N01 yield 42 directed N01↔peer links. The implementation explicitly distinguishes structural topology from live peer commissioning; a structural PASS is never presented as proof that remote deployments are online.

## Transport authority

`CanonicalTransportAdapter` remains the single transport adapter authority. The Mesh stack keeps the existing transport modes (`IN_PROCESS`, `WEBVIEW_BRIDGE`, `LOOPBACK_HTTP`, `HTTP`, `REALTIME`) and routes capability execution without creating a competing transport abstraction.

The canonical server now validates peer membership against the N01 peer set, checks request/response correlation, preserves HMAC verification when a secret is configured, reports 42 directed links, and uses fusion contract version 1.5. A stale 84-link assertion was corrected rather than propagated.

## Soul Sentinel

`SoulAdminService` is the active watchdog authority. It starts as a foreground service, observes Core/Mesh integrity through `SoulCortex`, records operational metrics, updates health status, evaluates recovery decisions, and performs a bounded self-restart after repeated watchdog-cycle failures. `SoulBootReceiver` starts it after boot when the persisted Sentinel setting is enabled; the default is enabled.

## 5×5 diagnostic

The canonical `mesh:diagnose` command executes a 25-check structural matrix across CORE, TRANSPORT, MESH, INTEGRITY and SENTINEL. It is intentionally structural: remote peer runtime availability remains a separate live commissioning criterion. This prevents a local green result from being misreported as global Mesh connectivity.

## Verification boundary

The current branch is not certified ONLINE merely because source checks are present. CI execution must produce concrete successful job evidence. Previous N01 runs with zero executable job steps are retained as runner/infrastructure evidence, not counted as passing tests.

## Continuity rule

Every subsequent N01 execution prompt must begin from this ledger and the current `consolidacao-n01` HEAD. It must audit the current state before changing anything, continue from the latest verified commit, avoid parallel solution lines, and record newly discovered failures as hardening work inside N01 until resolved or explicitly justified for another nucleus.
