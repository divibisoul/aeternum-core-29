# SOUL Legacy / Duplicate Cleanup Audit — 2026-09-01

## Rule
No artifact is removed merely because it is older, similarly named, or superseded in documentation. An artifact is removable only when repository references, package scripts, workflows, imports, and runtime entrypoints show that it is not part of the active execution path. When uncertain, preserve it and adapt it.

## Findings

### `bun.lockb`
The file is a binary Bun lockfile from the original Lovable template. `package.json` currently contains Vite/Node scripts and the repository also contains the text `bun.lock`. No active script or workflow inspected in the current tree invokes `bun.lockb` directly. The file's own history traces to the initial 2025-01-01 template commit, while `bun.lock` is the current readable lockfile. It is therefore classified **legacy candidate**, not deleted in this pass because package-manager compatibility should be verified by CI before removal.

### `scripts/soul-mesh-server.mjs` and `scripts/soul-mesh-server-entry.mjs`
These are **not duplicates**. The entry file is an outer ingress/proxy process that starts the inner server and adds N07 relay/contract handling; the inner server contains the N01 registry, routing, peer forwarding, and SuperGPU logic. Both are referenced by the `mesh:n01` startup path. They must be preserved.

### `SOUL-FUSION-MANIFEST.json` and `docs/SOUL-FUSION-REGISTRY.json`
These are **not safely removable duplicates**. The manifest is nucleus-local identity metadata; the registry is the system-wide fusion registry consumed by contract-check scripts. They intentionally have different scopes and must remain synchronized.

### `docs/*CLOSEOUT*`, `*STATE*`, `*HANDOFF*`, `*DIRECTIVE*`
These are engineering control/evidence artifacts. They are not runtime modules and cannot be classified as dead code solely by age. They remain preserved.

## Immediate correction
The audit discovered a stale CI checker: `scripts/soul-fusion-contract-check.mjs` and `scripts/soul-supergpu-check.mjs` still required fusion registry version 1.4 while the live registry is 1.5 and already contains N07. This is a real inconsistency, not a legacy file. The checkers must be updated to the current canonical registry rather than downgrading/removing the registry.

## Deletion decision
No runtime source file is deleted in this audit because no candidate has yet met the evidence threshold for safe deletion. The old `bun.lockb` remains quarantined as a legacy candidate pending package-manager CI evidence.
