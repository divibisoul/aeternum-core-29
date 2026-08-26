# SOUL — Capability Master Map

Status: live architecture inventory baseline. This document describes ownership and routing; it does not by itself prove E2E connectivity.

## Canonical nucleus mapping

| Nucleus | Repository | Role |
|---|---|---|
| N01 | `aeternum-core-29` | Android Sentinel / hybrid APK gateway |
| N02 | `nextjs-ai-chatbots` | AI/chat/tools/documents/context/streaming |
| N03 | `nexus-aeternum-fusion` | Nexus specialized/domain interface and context layer |
| N04 | `Eternium-` | Eternium AGI/tool/operations interface |
| N05 | `nextjs-ai-chatbot` | AI/chat/tools/artifacts/context/streaming |
| N06 | `nextjs-ai-chatbot-2000` | AI/chat/tools/artifacts/context/streaming |

## Ownership rule

Each capability has one owning provider. Other nuclei consume it through the Soul Mesh/Capability Router instead of copying its implementation.

## Confirmed capability families

- **N01:** native Android capabilities including device information, battery, memory, network/events, Shizuku bridge, brightness, Wi-Fi/Bluetooth/system controls and native device actions.
- **N02:** chat/AI streaming, documents, file upload, history/context and application-level tool infrastructure.
- **N03:** Nexus domain/context/UI capabilities and the Soul Mesh endpoint.
- **N04:** Eternium operational/AGI interface, tool panels, monitoring and Soul Mesh endpoint.
- **N05:** chat/AI streaming, documents, artifacts, context and tool infrastructure; Soul Mesh endpoint.
- **N06:** chat/AI streaming, documents, artifacts, context and tool infrastructure; Soul Mesh endpoint.

Capability ownership must be confirmed against executable handlers before being marked `CONNECTED`.

## Six-nucleus routing model

```text
User / AI Provider
       |
       v
N01 Pilot / Global Capability Router
       |
       +--> N01 Android native execution
       +--> N02 AI/chat/tools/documents/context
       +--> N03 Nexus domain/context
       +--> N04 Eternium operations/AGI tools
       +--> N05 AI/chat/tools/artifacts/context
       +--> N06 AI/chat/tools/artifacts/context
```

## Mesh topology

Each nucleus exposes exactly five logical OUT ports and five logical IN ports: 30 OUT ports + 30 IN ports = 60 directional channels across 15 bidirectional nucleus pairs.

A logical channel is not proof of connectivity. A directed channel is `CONNECTED` only after:

`source -> transport -> target endpoint -> message validation -> real handler/dispatch -> correlated response/error`

An endpoint that merely acknowledges receipt without dispatching to a real registered handler remains `UNVERIFIED`.

## Anti-duplication rule

Before adding a capability:

1. Search this registry.
2. Identify the owning nucleus.
3. Reuse the owner's interface through Mesh.
4. Add a new implementation only when no existing owner satisfies the contract.

## Current audit state

- N01 native capability layer: implemented.
- N01 global Pilot/Registry/Mesh bridge: implemented in the APK architecture.
- N02/N03/N04/N05/N06 Mesh endpoints: present in repository source and require deployed runtime URLs for live network E2E.
- N02/N06 capability inventories: must be reconciled against their actual executable handlers before final E2E certification.
- 60-channel live certification: not claimed until real request/response traffic has been observed for all 60 directions.

## Architectural invariant

The Android/Web project in N01 remains the hybrid native execution and user-access layer. The Soul is not reduced to a CPU-style bottleneck: the Pilot/Cockpit coordinates distributed capabilities and permits independent work to execute in parallel when dependencies allow.
