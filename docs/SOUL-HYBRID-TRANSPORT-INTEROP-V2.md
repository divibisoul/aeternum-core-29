# SOUL Hybrid Transport Interoperability V2

## Purpose

N01 is the canonical communication reference. The contract defines transport classes; it does not claim that every nucleus implements every class.

## Canonical transport classes

1. IN_PROCESS
2. WEBVIEW_BRIDGE
3. LOOPBACK_HTTP
4. HTTP
5. REALTIME

## Rule: capability before advertisement

A nucleus MUST advertise a transport only when its runtime contains an implementation or an explicitly registered adapter for that transport. A reference transport is not evidence of operational support.

## Negotiation

Negotiation is performed per peer and per connection. The common message contract remains independent of transport. A transport failure MUST NOT mutate the nucleus identity or disable its native tools/capabilities.

## Runtime classes

- IN_PROCESS: local runtime/function dispatch.
- WEBVIEW_BRIDGE: browser/native boundary; use an explicit origin-controlled bridge.
- LOOPBACK_HTTP: local process boundary where a loopback listener is actually available.
- HTTP: request/response interoperability.
- REALTIME: persistent event delivery; WebSocket or SSE may be used according to direction and runtime capability.

## Security

WebView bridges MUST be restricted to trusted content/origins. Browser event transports must validate message identity, correlationId, source, target and capability before dispatch.

## Current verified repository evidence

- N01 already contains the hybrid communication audit and distinguishes LOCAL, WEB_SESSION and REMOTE_SERVICE execution.
- N03 package dependencies include Supabase, so REALTIME can be implemented through its existing runtime rather than being declared fictitiously.
- N02 is a Vite/React browser application; HTTP and in-process browser dispatch are the conservative baseline.
- N04/N05/N06 are Next.js applications; HTTP and server in-process dispatch are the conservative baseline until additional transports are implemented and registered.

## Upgrade rule

When a transport is missing, add an adapter without replacing the nucleus runtime. When a transport cannot be implemented in a given runtime, leave it as an adapter target and do not advertise it as active.
