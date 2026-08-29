# N01 — Historical Consolidation

## Purpose

This record reconciles work performed across parallel Soul conversations without deleting or invalidating existing implementation. GitHub state is the authoritative implementation state; conversation claims are treated as historical intent only.

## Preserved architecture

N01 remains the Android/APK communication reference and does not absorb capabilities owned by N02–N06. Existing WebView/Android bridge, in-process routing, HTTP transport, inbound listener, RPC correlation, peer configuration, capability registry/discovery, health/handshake, channel model and existing Supabase-related components remain preserved.

## Consolidation rule

Existing code is classified as canonical, compatibility/legacy, integration, or candidate for later cleanup. No deletion is performed merely because parallel work produced overlapping names or layers.

## Cross-language wire contract

The canonical Mesh protocol is `soul-mesh/1`, contract version `1.1.0`, with nucleus IDs N01–N06 and message kinds request/response/event/error. Messages carry id, correlationId, source, target, capability, payload and epoch-millisecond timestamp. Self-targeted inter-nucleus messages are rejected.

## New transport hardening

The Android outbound HTTP transport now:

- validates endpoint schemes before opening a connection;
- propagates protocol, contract, message identity and routing headers;
- validates response correlationId against the originating request;
- validates response source/target reversal against the originating route;
- requires an error envelope for non-2xx responses;
- always disconnects the HTTP connection in a `finally` block;
- preserves the existing transport abstraction and endpoint map.

## Current truth

Source-level communication infrastructure is consolidated. Real six-nucleus runtime interoperability remains a separate verification state and must not be represented as proven until the deployed runtimes exchange real capability transactions.

## Next consolidation layer

The next N01 pass should reconcile capability ownership, dispatcher routing, peer discovery and transport selection so N01 can route work to the nucleus that owns the capability while remaining transport-agnostic. Existing native capabilities must remain intact.
