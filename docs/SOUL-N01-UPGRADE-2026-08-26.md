# N01 Upgrade — Hybrid AI Mesh v2 — 2026-08-26

## Scope

This upgrade is based on direct inspection of the N01 repository, not on the presence of filenames alone.

Repository: `divibisoul/aeternum-core-29`
Branch: `upgrade/n01-hybrid-ai-mesh-v2`

## What N01 actually contains

N01 is simultaneously:

- a Vite/React/TypeScript application shell;
- a native Android/Soul Sentinel APK under `soul-sentinel/`;
- a cognitive pipeline containing Intent Analyzer, Prompt Crafter, Precision Engine, Code Vault, Self-Loop and multi-hemispheric cognitive modules;
- an AeternumAGI runtime with multiple cognitive, safety, integrity, resource and GEM subsystems;
- a native Android capability layer containing device/context observation and user-mediated Android actions;
- a hybrid WebView/Android boundary;
- a Soul Mesh protocol, router, transports, capability registry and peer matrix.

The package manifest confirms the web side is React/TypeScript/Vite with Supabase, Zustand, React Query, Framer Motion and Zod dependencies. The application startup path initializes the neural system, algorithmic cognition, AeternumAGI, modules and diagnostics.

## Findings that required correction

### 1. Nucleus identity mismatch

The TypeScript Mesh protocol canonically uses `N01..N06`, while the previous peer endpoint and connectivity implementation used labels such as `aeternum`, `nexus`, `eternium`, `chatbot`, `chatbots` and `chatbot-2000`.

This was a structural interoperability defect: the transport could not reliably treat the logical six-nucleus IDs as the same identifiers used by the protocol.

### 2. Fake local peers in the Android bootstrap

The previous Android bootstrap registered every N01..N06 identifier into the local runtime even though those remote nuclei were not locally implemented. This could make the registry appear complete without proving remote connectivity.

The upgrade registers only the real N01 endpoint locally. Remote nuclei are reached only through a configured transport endpoint.

### 3. N01 local executor was effectively ping-only

The native `SoulHybridCapabilityExecutor` had a local branch for `mesh.ping` and returned `LOCAL_CAPABILITY_NOT_IMPLEMENTED` for other local capabilities.

The upgrade binds real N01 native capabilities including device information, battery, memory, network, Wi-Fi state and Bluetooth state. Android-changing actions remain behind an explicit authorization callback.

### 4. TypeScript router trusted incoming messages too much

The previous router dispatched messages without first validating the canonical protocol shape and did not suppress duplicate message IDs.

The upgrade validates protocol/source/target/kind/timestamp, tracks recently seen message IDs and returns explicit error codes for missing or failed capability handlers.

### 5. Hybrid wire-format mismatch

Android emits ISO-8601 timestamps while the TypeScript contract previously expected numeric timestamps. Android also recognizes `ack` while the TypeScript contract did not.

The TypeScript wire validator now accepts both epoch milliseconds and ISO-8601 timestamps and recognizes `ack`, preserving backward compatibility for existing numeric senders.

## Existing N01 AI capabilities preserved

The upgrade does not replace the existing cognitive engines. The Web runtime already contains:

- IntentAnalyzer;
- Alpha/Beta/Gamma cognitive processing;
- UnifiedResponseGenerator;
- PromptCrafter;
- PrecisionEngine;
- CodeVault;
- SelfLoop;
- AeternumAGI;
- ProjetoClareira;
- ConscienciaAlgoritmica;
- SAIIC;
- ResourceManager;
- ConnectivityManager;
- QuantumNeuralInterface;
- GEMHealth;
- GEMResearch;
- GEMMusic;
- GEMDevice;
- Chat Engine;
- Supabase-backed chat execution.

The new N01 Mesh runtime exposes selected existing functions through adapters rather than duplicating them.

## New N01 Mesh runtime capabilities

- `mesh.handshake`
- `mesh.health`
- `mesh.capabilities`
- `cognitive.intent`
- `agi.process`
- `ai.reasoning`
- native Android state capabilities

`ai.reasoning` is provider-neutral at the adapter boundary. The current Web runtime may attach the already-existing PrecisionEngine + Supabase chat path; the Mesh layer itself does not hard-code an AI vendor.

## Hybrid transport model

N01 now supports a transport-neutral architecture in which the logical channel remains `N01 -> Nxx` regardless of the physical mechanism.

Supported paths include:

- HTTP/HTTPS to a configured peer endpoint;
- BroadcastChannel for same-origin/hybrid WebView scenarios;
- the existing Android WebView bridge;
- the existing native Android HTTP transport.

No peer URL is fabricated. A remote nucleus becomes operational only after a real endpoint is configured and traffic succeeds.

## Capability ownership

The Android catalog now explicitly distinguishes:

- owner nucleus;
- execution mode;
- risk class.

Read-only device capabilities can execute locally. Mutating Android actions such as brightness changes and background-process termination require explicit authorization. This preserves the existing Guardian/security intent rather than giving remote AI traffic unrestricted Android privileges.

## Proof standard

The upgrade deliberately does **not** mark N02–N06 as connected.

A directed link remains unverified until:

`source -> transport -> target -> protocol validation -> capability dispatch -> real handler -> correlated response`

has actually succeeded.

Therefore the branch improves N01's ability to participate in the six-AI hybrid mesh but does not falsely claim that 60 directional channels are already live.

## Acceptance criteria for the next integration phase

1. Build the Android APK successfully.
2. Run existing Android instrumentation tests.
3. Configure one real endpoint for each available remote nucleus.
4. Execute `mesh.handshake` and `mesh.health` against each peer.
5. Execute at least one real capability owned by each peer.
6. Verify correlated response in both directions.
7. Only then promote individual directed links to `CONNECTED`.
8. Repeat until all 30 OUT and 30 IN directed links have independent evidence.

## Architectural result

N01 is now treated as an AI nucleus plus native execution host, not merely as a router. Its existing cognitive systems remain the implementation substrate, while Soul Mesh becomes the interoperability layer that allows heterogeneous AI runtimes to exchange requests, capabilities, context and results without requiring their internal implementations to be identical.
