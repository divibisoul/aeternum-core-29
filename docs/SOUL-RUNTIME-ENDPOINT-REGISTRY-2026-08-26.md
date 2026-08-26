# Soul Runtime Endpoint Registry — 2026-08-26

This registry separates topology, source implementation, deployment configuration and runtime proof. No endpoint is considered operational merely because a file exists.

| Nucleus | Current runtime form | Inbound mesh implementation | Evidence level |
|---|---|---|---|
| N01 | Android APK + WebView/host | APK bridge/runtime gateway | source-confirmed; device E2E pending |
| N02 | Next.js server | `/api/soul-mesh` POST | source-confirmed; deployed E2E pending |
| N03 | Vite/React application | `api/soul-mesh.ts` + `src/soul-mesh/endpoint.ts` | source-confirmed; deployment E2E pending |
| N04 | Next.js server | `/api/soul-mesh` POST | source-confirmed; deployed E2E pending |
| N05 | Next.js server | `/api/soul-mesh` POST | source-confirmed; deployed E2E pending |
| N06 | Vite/React application | `api/soul-mesh.ts` + `services/soulMeshAdapter.ts` | source-confirmed; deployment E2E pending |

## Hybrid transport rule

The Soul fabric is transport-neutral. A directed channel may use `IN_PROCESS`, `WEBVIEW_BRIDGE`, `LOOPBACK_HTTP`, `HTTP`, or `REALTIME`, selected by the N01 gateway according to deployment/runtime availability. The APK is the user-facing universal gateway, but capability ownership remains with the nucleus that implements it.

## Proof rule

A channel progresses through `UNVERIFIED → NEGOTIATING → CONNECTED → EXECUTED → VERIFIED`. This is evidence tracking, not a restriction on the GPU fabric. Failed transport attempts must permit fallback rather than disabling the capability globally.

`CONNECTED` means the target accepted the message. `EXECUTED` requires the target handler to have run. `VERIFIED` requires correlated response plus useful-result validation. HTTP 200, an existing route, a registry entry, or a health response alone is never sufficient.

## Required runtime configuration

N01 must obtain the deployed endpoints for N02–N06 from deployment configuration/service discovery. N03 and N06 now expose an inbound HTTP-compatible function at `/api/soul-mesh` when deployed on a platform that supports file-based API functions. A deployment must be tested before its URL is promoted to a verified channel.

## Global capability view

The Cockpit should represent every capability as:

`capability → owner nucleus → dependency/provider → transport candidates → execution handler → result/proof`

The user-facing APK may dispatch any capability regardless of owner. It must not copy or duplicate ownership merely to expose the capability.

## Current gap question

**What is still required for the hybrid system to be fully connected and normally functional?**

1. Deploy/host N03 and N06 inbound functions and record their real URLs.
2. Configure N01 service discovery for all six runtimes.
3. Connect Web Session → AI Provider → global Pilot without binding any nucleus to a specific AI vendor.
4. Populate the global capability registry from the actual six repositories and preserve each existing handler/tool.
5. Execute directed E2E probes for all 30 OUT channels and 30 IN channels, recording transport, handler execution, correlation and useful result.
6. Run a full-system parallel orchestration test through the APK/Cockpit to validate cross-nucleus synergy.
