# Soul Hybrid APK — optimization baseline

## Target

One Android APK hosts the native Android shell and the portable web runtimes. The six nuclei remain modular source domains; the APK owns lifecycle, UI bridge, Mesh routing, permissions, security, persistence boundaries and release packaging.

## Nine formerly-yellow areas addressed in this baseline

1. APK base: N01 Android module is the host application.
2. Hybrid interface: local WebView asset + JavaScript bridge are part of the APK.
3. Endpoint lifecycle: endpoints are initialized from the host runtime rather than treated as repository folders.
4. Runtime isolation: server-only Next.js code is not copied into the WebView; it remains a service boundary.
5. External services: database/Redis/Supabase/AI services are treated as remote capabilities, never bundled as server processes inside the APK.
6. Security: WebView local content is used as the trusted UI boundary; remote navigation must not be granted implicitly.
7. Release build: R8/resource shrinking and bridge keep rules are enabled.
8. Configuration: environment/service configuration belongs outside source and is injected per build/runtime.
9. Verification: the final green gate is an installable APK plus runtime Mesh E2E tests, not file existence.

## What an APK can and cannot contain

Vite/React client bundles can be built to static assets and hosted locally in WebView. Next.js server components, API routes and database servers cannot simply be embedded in WebView. Their portable client capabilities can be bundled; server capabilities must remain remote or be rewritten as Android/local services.

## Final optimization sequence

`build client bundles -> copy assets -> initialize Android host -> initialize Mesh -> expose capabilities -> connect remote services -> run E2E -> release APK`.

No optimization is considered production-green until the resulting APK installs and the runtime proof succeeds.
