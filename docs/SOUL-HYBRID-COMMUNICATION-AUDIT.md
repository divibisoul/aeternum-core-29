# Soul Hybrid Communication Audit

## Implemented

- Android is the APK host.
- `SoulHybridActivity` is now the launcher.
- WebView uses an app-local HTTPS asset origin.
- JavaScript -> Kotlin -> Mesh is implemented through `SoulHybridBridge.dispatch`.
- Kotlin -> JavaScript completion is implemented through `SoulHybridBridge.complete` plus `evaluateJavascript`.
- The Mesh has six runtime identities and 30 directed logical routes.
- `mesh.ping` is a transport-level capability accepted by every nucleus.
- Capabilities are classified as `LOCAL`, `WEB_SESSION`, or `REMOTE_SERVICE`.
- Web-session capabilities are delegated to the Web runtime instead of being falsely executed by Kotlin.
- User AI login is represented as a browser session; passwords/API keys are not collected by the bridge.
- Android instrumentation tests cover all 30 directed logical routes and Web-session delegation.

## Important distinction

A Mesh endpoint in a source repository does not mean that the repository's entire application is inside the APK. The six repositories are private and heterogeneous. Next.js server components cannot be embedded directly as WebView assets; their server-backed capabilities remain external until an explicit client/runtime adapter is packaged.

## Current capability execution

`LOCAL` executes inside the Android runtime.

`WEB_SESSION` crosses the native/Web boundary and must be handled by a registered browser-side provider/module.

`REMOTE_SERVICE` requires a configured authenticated remote endpoint; an empty endpoint map intentionally fails closed rather than pretending a remote service exists.

## Verification rule

A capability is GREEN only after its implementation is compiled and its runtime path is exercised. Source declarations alone are not sufficient evidence.
