# Soul Runtime Endpoint Registry — 2026-08-26

This registry separates declared topology from runtime evidence. It must be updated only from direct repository/runtime inspection.

| Nucleus | Current runtime form | Direct mesh endpoint found in source | Evidence level |
|---|---|---|---|
| N01 | Android APK + WebView/host | APK bridge/runtime components | structural; device E2E pending |
| N02 | Next.js server | `/api/soul-mesh` POST | source-confirmed; deployed E2E pending |
| N03 | Vite/React application | `src/soul-mesh/endpoint.ts` handler + outbound hybrid transport; no server route confirmed | source-confirmed handler; inbound deployment E2E pending |
| N04 | Next.js server | `/api/soul-mesh` POST | source-confirmed; deployed E2E pending |
| N05 | Next.js server | `/api/soul-mesh` POST | source-confirmed; deployed E2E pending |
| N06 | Vite/React application | `services/soulMeshAdapter.ts` + outbound hybrid transport; no server route confirmed | source-confirmed adapter; inbound deployment E2E pending |

## Interpretation

"Source-confirmed" means the repository contains the relevant executable code. It does not mean that an Internet/deployment endpoint is reachable. "E2E pending" is a testing state, not a restriction on the Soul's ability to use fallback transports.

The APK gateway must select an available transport at runtime and may retry/route through alternative transport mechanisms. A failed transport attempt should trigger fallback according to policy rather than disabling the capability globally.

## Next evidence required

For every directed channel: prove request transmission, target receipt, target handler execution, correlated response, authorization, and useful result. For channels terminating at browser-only nuclei, prove the WebView/bridge or host adapter path. For N02/N04/N05, prove the deployed `/api/soul-mesh` endpoint rather than inferring it from source.
