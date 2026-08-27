# N01 Mesh — Closure Audit

Branch: `upgrade/n01-5x5-channels-v2`

## Implementation checklist

| Requirement | Status | Evidence |
|---|---|---|
| 5 IN logical channels | GREEN | `N01Channels.ts`, `N01MeshChannelFabric.ts` |
| 5 OUT logical channels | GREEN | `N01Channels.ts`, `N01MeshChannelFabric.ts` |
| Real Vite development HTTP IN routes | GREEN | `vite-n01-mesh-plugin.ts` + `vite.config.ts` |
| IN → `N01MeshIngress` → canonical `SoulMeshRouter.ingest()` | GREEN | `N01MeshIngress.ts`, `SoulMeshRouter.ts` |
| Invalid token rejected with 401 | GREEN (implementation + CI test defined) | Vite dev middleware + `n01-validation.yml` |
| Persistent peer discovery in IndexedDB | GREEN | `IndexedDBDiscoveryAdapter.ts` |
| Browser diagnostic reads IndexedDB | GREEN (implementation) | `N01BrowserDiagnostic.ts` + `mesh-diagnose.html` |
| OUT uses discovery + `SoulMeshHttpTransport` | GREEN | `N01MeshChannelFabric.ts` |
| HTTP responses returned to canonical router | GREEN | `N01MeshChannelFabric.ts` |
| Event ACK via `sendEventAndWait()` | GREEN (implementation) | `SoulMeshRouter.ts`, browser diagnostic |
| Per-peer token hydration at N01 boot | GREEN | `SoulMeshRuntime.ts`, `N01SessionAuth.ts` |
| Remote capability snapshot preserved | GREEN | `SoulMeshDiscovery.ts` |
| `N01ChannelRouter` duplicate deprecated | GREEN | compatibility shim only |
| Transport lifecycle close | GREEN | `SoulMeshTransport.close?()` + channel fabric |
| No N02–N06 source changes | GREEN | N01-only change set |
| README / APK transition documented | GREEN | `README.md` |
| Removed dependencies absent from `package.json` | GREEN | `package.json` |
| `package-lock.json` synchronized | PENDING CI | `.github/workflows/n01-lock-sync.yml` regenerates it with npm |

## Runtime validation

The repository now contains a CI workflow that starts the Vite development host, validates all five `/mesh/in/Nxx` routes, verifies a valid token is accepted and an invalid token receives HTTP 401, and runs the production build. The workflow is `.github/workflows/n01-validation.yml`.

The browser diagnostic is deliberately separate from the Node process because the N01 persistence contract is browser IndexedDB. `npm run mesh:diagnose` launches Vite and opens `mesh-diagnose.html`; that page hydrates the real IndexedDB adapter and runs the IN, OUT, event/ACK and invalid-token checks against development mock peers.

The current GitHub connector session cannot execute a browser UI or wait for a newly queued GitHub Actions run. Therefore this file does **not** fabricate a PASS result for those runtime executions. The implementation is committed; the remaining machine-generated evidence is the CI result and browser diagnostic output.

## APK boundary

The five logical IN channels and five OUT channels are transport-neutral. The current Vite middleware is a development host only. The APK must replace it with a native Android HTTP/WebSocket service and move token persistence to Android Keystore/secure storage while keeping the same channel IDs and Soul Mesh contracts.
