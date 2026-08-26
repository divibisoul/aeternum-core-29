# Soul hybrid APK audit

## Verified facts

- N01 has a real Android application module (`soul-sentinel`) with Android Gradle configuration, Compose UI and runtime classes.
- N01 now has a WebView bridge (`SoulHybridBridge`) and the WebView dependency.
- N01 Mesh transport can receive HTTP messages on loopback and can return either ACK or an endpoint-generated response.
- N01 has instrumentation tests for loopback transport, malformed-message rejection, and request -> endpoint -> correlated response.
- N02/N04/N05 are Next.js applications with server-side dependencies (database/auth/blob/server-only). They are NOT presently static Android assets and cannot simply be copied into an APK as-is.
- N03/N06 are Vite React applications and are structurally much closer to a WebView/static-asset integration.

## Consequence

The hybrid APK must treat the six repositories as source domains, not as six APKs. The Android host is N01. Web-compatible capabilities can be bundled as static assets when their build is compatible; server-only capabilities require an explicit runtime boundary (local service, remote service, or ported native implementation). The Mesh bridge is the boundary.

## No false-positive rule

A TypeScript endpoint file existing in a repository does not prove that the endpoint executes on Android. An Android build passing does not prove all six domains are packaged. A logical route does not prove live connectivity.

## Current blockers

1. N02/N04/N05 need a defined Android runtime strategy for their server-side functionality.
2. The six endpoints need real transport binding and end-to-end execution, not only identical adapter source.
3. The final APK packaging step must explicitly include the chosen web assets/runtime.
4. A real Android emulator/device must exercise the final integrated APK.

## Target acceptance test

`APK UI -> Mesh bridge -> router -> target endpoint -> capability -> response -> Mesh bridge -> UI`

The final acceptance gate is the six-nucleus APK, not a repository-only static inspection.
