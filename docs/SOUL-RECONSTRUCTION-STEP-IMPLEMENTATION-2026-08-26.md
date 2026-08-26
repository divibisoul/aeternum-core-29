# Soul Reconstruction — Implementation Step

## Directive
The Soul is a GPU-like hybrid fabric: preserve parallelism, preserve all useful capabilities, and let N01/APK expose every capability regardless of owning nucleus. AI is a session/provider attached by the user; it is not a nucleus and is not hard-wired to Gemini/OpenAI.

## Implemented in this step
1. N03 inbound hybrid `/api/soul-mesh` function added.
2. N06 inbound hybrid `/api/soul-mesh` function added.
3. N02/N04/N05 mesh health and capability-discovery handlers added.
4. N01 runtime service discovery added through deployment environment variables.
5. N01 universal gateway added with HTTP/loopback/WebView fallback semantics.
6. N01 global capability registry added with owner/dependency/transport/execution/proof fields.
7. N01 affinity-based Pilot added with parallel dispatch support.
8. N01 vendor-neutral AI session provider boundary added.
9. Directed mesh E2E harness added; it fails when proof/correlation is absent instead of reporting success.
10. Optional bearer authentication added to N03/N06 inbound endpoints.

## Evidence discipline
Source code proves implementation exists. It does not prove deployment reachability. A successful HTTP response proves neither handler execution nor useful result unless the response carries correlated execution proof.

## Current system question
**What still has to happen for the entire hybrid system to operate normally with all existing tools/functions?**

- Deploy N03/N06 API functions and configure their real URLs in N01.
- Configure N02/N04/N05 real deployment URLs.
- Wire N01 WebView session to an actual provider adapter; credentials must remain inside the provider's session boundary.
- Aggregate the complete capability inventories from all six repositories into the global registry, retaining existing owners and handlers.
- Add native N01 inbound probes for its five IN channels.
- Run the directed matrix against all 30 logical OUT channels and 30 logical IN channels using real deployments/runtimes.
- Validate useful-result semantics for representative capabilities, not only health.
- Run parallel cross-nucleus scenarios to measure synergy and fallback behavior.

Until those runtime operations are executed, the source implementation must not be described as a fully connected production system.
