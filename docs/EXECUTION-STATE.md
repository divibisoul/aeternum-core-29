# SOUL — LIVE EXECUTION STATE

Last updated: 2026-08-29

This is the execution control board. An item cannot remain OPEN without a concrete next action. Every completed item requires repository evidence and validation evidence.

## Current floor: N01 + parallel fusion foundations

| ID | Stage | Status | Done | Remaining | Why not complete |
|---|---|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Existing N01 structure, Mesh registry, transports, provider/bridge direction inspected | None | Closed |
| N01-02 | Capability Graph | IMPLEMENTED / VALIDATION OPEN | CapabilityGraph.ts exists with ownership, status, cost, privacy, dependencies and permissions | Runtime exposure + tests | Source structure exists; executable bridge exists and is structurally validated |
| N01-03 | CognitiveProvider contract | IMPLEMENTED / VALIDATION OPEN | Provider-neutral local/browser/cloud contract + fallback exists | Concrete local provider + tests | Dependency choice deferred until transport path is stable |
| N01-04 | Browser Session bridge | IMPLEMENTED / VALIDATION OPEN | Session states and correlation IDs exist; credentials excluded | Secure extension boundary + tests | Browser messaging boundary still needs validation |
| N01-05 | Hardware profiler | IMPLEMENTED / VALIDATION OPEN | WebGPU/WASM/CPU selection primitive exists | Runtime benchmark + tests | Detection is not benchmark proof |
| N01-06 | Canonical Mesh envelope | IMPLEMENTED / VALIDATION OPEN | v1.0 envelope with node IDs, message types, timestamp, nonce, TTL, correlationId and HMAC-SHA256 verification | Runtime transport acceptance/emission proof | Integrated test requires CI/runtime evidence |
| N01-06A | Canonical transport adapter | IMPLEMENTED / VALIDATION OPEN | Adapter consumes `HybridTransportRegistry` as the single transport source and is wired into MeshRouter | Successful CI/build/lint validation | GitHub runner currently fails before executing steps |
| N01-07 | Authorization | BLOCKED | Permission fields exist | Enforce permission before task dispatch | Requires canonical verified task path |
| N01-08 | Executable tests | LOCAL PASS / CI ENV BLOCKED | Native transport contract passes locally; GitHub Actions starts a job but exposes no runner/step evidence and fails with runner_id 0 | Obtain actionable CI runner result | This is currently an infrastructure-level validation blocker, not a claimed code pass/fail |
| N01-09 | N01↔N02 transaction | INTEGRATION REPAIR APPLIED | N01 forwarding contract and N02 ingress were cross-audited; N02 now has `/api/soul-mesh` compatibility ingress | Signed bidirectional correlated transaction with secret enabled | Unsigned legacy compatibility is intentionally rejected when secret mode is enabled |
| N01-10 | Final N01 audit | BLOCKED | None | Before/after evidence and percentage | Cannot close before runtime proof |

## Confirmed execution commits

- `c8b4574f6fc1e0967e9ee8cbf3c59c7e4cfccfc6`: prior canonical envelope implementation.
- `3a772db715f2a223cb595158df23e6f79104e73e`: added canonical transport adapter.
- `26fce025e4f16d1b54cbbc885180d907496d7262`: corrected adapter independence from an uncommitted registry API.
- `23edfd297e21e9eb4dfe93bd276673abd4564529`: aligned CI with Node 22 for native TypeScript stripping.
- `5aa5d4b001bd9c925ecb524d08d4a1788615ed30`: made the canonical adapter consume the existing transport registry.
- `0b4b1e599dfef4ed76a2a773208b1a45c25199e7`: expanded the transport contract test.
- `cf69107fc95f3f01a053ca960919bef3a7825ba2`: wired MeshRouter selection/framing through the adapter.
- `6bef438f7610378c66eb1261d949aa03650054e4`: enabled validation on active feature/upgrade branches.
- `823195f6761333b1e29243e8d8b3a3ef2b4a2194`: made adapter imports explicit for native Node TypeScript resolution.
- `fe14e7cadb27f3714a31412b9838fd2463972c54`: made MeshRouter imports explicit for native Node TypeScript resolution.
- `310c82e56d7388b8f3018372ea58f67a9d68b5c2`: made N01 capability bridge imports explicit.

## Cross-front repair evidence

N01's current `scripts/soul-mesh-server.mjs` was inspected against N02's active `feature/n02-mesh-autonomous-adapter` branch. The audit found a concrete route/protocol mismatch: N01 forwards peer messages to `/api/soul-mesh`, while N02's original server exposed only `/mesh/in` and expected the canonical envelope. N02 was repaired additively with an `/api/soul-mesh` ingress alias and an isolated legacy-to-canonical adapter. The compatibility layer is deliberately unsigned-only; when `SOUL_MESH_SECRET` is enabled, legacy traffic is rejected and the canonical signed envelope remains mandatory.

N02 also received an executable `mesh/compatibility.test.mjs` contract and a CI invocation. Local execution of the compatibility contract passed.

## Validation evidence

- N01 GitHub Actions run `33284212819` and N02 run `33284340349` both reached a job but failed before any step executed; the job payload reports `runner_id: 0` and an empty `steps` array. They are not being interpreted as code failures or green passes.
- Local N01 canonical transport contract: PASS.
- Local N02 legacy/canonical compatibility contract: PASS.
- The latest N02 branch was re-read after the repair; the server, compatibility adapter, test, package script and CI workflow are all present in the current GitHub state.

## Cross-front observation — verified from GitHub

- N02: active PR #7 is the N01 pair boundary; its next architectural work is signed bidirectional discovery/invocation and grounded agent/tool/capability composition.
- N03: current work binds N02↔N03 synergy to runtime inventories and executable pair-fusion tests.
- N04: current work provides a 15-capability execution surface, runtime bootstrap validation and cooperative capability fusion.
- N05/N06: current fusion state requires inspection of both real agent registries/execution paths and actual capability/tool/agent intersections before adding adapters.

## Cumulative fusion directive

L1 remains concurrent: `N01×N02 || N03×N04 || N05×N06`. A repair discovered in one front is immediately evaluated against the other pair fronts and recorded so the six conversations can consume the same evidence. Higher-order fusion must use actual repository evidence, not declared capability names alone.

## Next single executable action

Re-run/obtain actionable CI runner evidence; if the runner becomes available, execute the N01/N02 signed canonical discovery transaction. If the runner remains unavailable, continue the structural N01↔N02 agent/tool/capability cross-map without waiting, while preserving the secure canonical envelope as the only production path when secrets are enabled.

## Anti-loop rule

After each code change, update this file with the verified commit SHA, validation result, state, blocker (if any), and exactly one next executable action. Never repeat an analysis cycle without changing the evidence state.
