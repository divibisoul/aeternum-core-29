# Engineering Status

This dashboard is refreshed from the current GitHub state. Percentages are progress indicators only; they never substitute for proof.

## Global acceptance gates

| Gate | State | Evidence / rule |
|---|---|---|
| N01-N07 CI/build gates | IN_PROGRESS | Current repository revisions are being revalidated; stale runs are never reused as proof. |
| Canonical contract `soul-mesh/1` + `1.1.0` | STRUCTURALLY_ALIGNED | All seven nucleus manifests and active Mesh adapters are being aligned to the seven-nucleus contract. |
| Canonical discovery `/api/soul-mesh/*` | STRUCTURALLY_ALIGNED | N01 exposes discovery/register/health and N07 registration; live peer execution remains a deployment-level proof. |
| Real capability execution E2E | NOT_VERIFIED | Must be proven with a non-ping capability transaction and correlated result between deployed runtimes. |
| Health/circuit behavior | VERIFIED_PER_COMPONENT | N01/N07 component gates cover health/resilience; federation-wide behavior remains deployment verification. |
| Duplicate runtime/processor | AUDIT_IN_PROGRESS | Legacy/compatibility layers are preserved unless dependency analysis proves they are removable. |
| N07 | ACTIVE | Unified backend, Supabase persistence, Storacha-capable storage, SuperGPU registration and production container are present and CI-tested. |
| TCE | PRESERVED | Existing TCE assets remain untouched unless an active dependency is proven. |

## Current measured state

| Nucleus | Structural state | Verified state | Current focus |
|---|---|---|---|
| N01 | ALIGNED | Recent source-level corrections applied; GitHub runner failures require current re-run evidence. | Finish current CI and final seven-nucleus documentation synchronization. |
| N02 | ALIGNED | Canonical Mesh endpoint and v1.5 manifest applied; CI runner currently reports failure without step output. | Re-run CI and resolve any source-level failure if steps become available. |
| N03 | ALIGNED | Canonical Mesh endpoint and v1.5 manifest applied; latest runner currently has no step output. | Re-run CI and confirm multimodal capability surface. |
| N04 | ALIGNED | Mesh endpoint preserves legacy `ack` ingress while emitting canonical responses; current CI was previously green. | Validate N07/backend reachability in the actual application tool path. |
| N05 | ALIGNED | Native Mesh facade preserved and v1.5 manifest synchronized. | Validate application dispatch and peer execution against current HEAD. |
| N06 | ALIGNED | Channel contract and v1.5 manifest synchronized. | Validate current tool/runtime execution against canonical Mesh. |
| N07 | ACTIVE | Go format, vet, tests, race, build and backend regression passed; production Docker build is being validated. | Complete container gate and deployability evidence; then perform live federation commissioning. |

## Recent concrete corrections

- Reintroduced and integrated the N07 backend package that the executable imports.
- Added Supabase `n07_runs` and `n07_artifacts` persistence with RLS and service-role-only access.
- Added current Storacha/Gu​​ppy-backed upload path while preserving explicit legacy compatibility.
- Added CID validation, upload size limits and cancellation-safe storage operations.
- Added production Docker image and persistent production Compose configuration.
- Added GHCR publication workflow for the production container.
- Fixed N07 backend storage tests to use a valid IPFS CID fixture.
- Fixed N07 CI container smoke test so it cannot block by launching the server as a help command.
- Synchronized seven-nucleus manifests and N01 fusion/SuperGPU validation to registry version 1.5.
- Preserved active legacy compatibility layers instead of removing them on naming/age alone.

## Legacy cleanup rule

An old or similarly named artifact is deleted only after repository references, imports, package scripts, workflows, deployment manifests, branches and runtime entrypoints prove it is outside the active execution graph. Otherwise it is preserved and, where necessary, converted into a compatibility or upgraded implementation.

## Verification discipline

For every change:

1. Read current file and current commit state.
2. Check for concurrent changes.
3. Apply the smallest correct change.
4. Re-read the resulting file and commit.
5. Use the strongest available CI/test/runtime evidence.
6. If a new failure appears, correct it before advancing that workstream.
7. Re-audit the changed dependency graph for regressions.

Last refresh: 2026-09-01
