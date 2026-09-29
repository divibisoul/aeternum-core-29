# SOUL — Capability Master Map

Status: architecture inventory only. No capability implementation is duplicated by this document.

## Ownership rule
Each capability has one owning provider. Other nuclei consume it through the Soul Mesh/Capability Router instead of copying its implementation.

## Confirmed providers

| Provider | Role | Confirmed capabilities |
|---|---|---|
| N01 / Android Sentinel | Native Android capability layer | android.device_info, android.battery, android.memory, android.network, android.events, shizuku.bridge, brightness, Wi-Fi panel/state, Bluetooth request/state, airplane settings, background-process request |
| N03 / Eternium | Specialized knowledge/context and existing domain tools | inventory pending final six-nucleus audit |
| N04 / nextjs-ai-chatbots | AI/tool/document/context/streaming layer | tool execution, artifacts, documents, context orchestration, streaming, mesh communication, AI Pilot boundary |
| N05 / nextjs-ai-chatbot-2000 | AI/tool/artifact/chat infrastructure | AI Pilot boundary, tool execution, artifacts, documents, context orchestration, streaming, mesh communication; existing request_suggestions and document/weather tools |
| N02 | Pending repository audit | Do not duplicate until audited |
| N06 | Pending repository audit | Do not duplicate until audited |

## N01 native capability contract

N01 is the original Android APK/native layer. Its registry reports:

- android.device_info
- android.battery
- android.memory
- android.network
- android.events
- shizuku.bridge
- ai.request_suggestions (consumer route to N05)

N01 also owns Android actions such as brightness, Wi-Fi panel/state, Bluetooth request/state, airplane settings and background-process requests.

## Routing model

```text
User / AI Pilot
      |
      v
Global Capability Router
      |
      +--> N01 Android Sentinel ----> Android OS
      |
      +--> N03 specialized/domain capabilities
      |
      +--> N04 AI/tools/documents/context/streaming
      |
      +--> N05 AI/tools/artifacts/context
      |
      +--> N02 (pending)
      |
      +--> N06 (pending)
```

## Anti-duplication rule

Before adding a new capability to any nucleus:

1. Search this registry.
2. Identify the existing owner.
3. Reuse the owner's interface through Mesh.
4. Add a new implementation only when no existing owner satisfies the contract.

## Connection contract

Each nucleus is intended to expose five inbound and five outbound peer routes. Logical route declarations are not treated as proof of live E2E connectivity. Live connectivity requires transport, endpoint availability, correlation, acknowledgement/response validation and health checks.

## Current verified status

- N01 native capabilities: implemented in Android code.
- N04 capability/process/mesh layers: implemented; E2E contract exists.
- N05 capability/process/tool/mesh layers: implemented; E2E contract exists.
- N03: existing project audited; integration map remains subject to final six-nucleus inventory.
- N02/N06: not yet inventoried in this document.

## Important architectural decision

The Android/Web project in N01 is not discarded. The Android side remains the native execution layer. Web/chat functionality is consumed as an AI capability where appropriate rather than duplicated as a second independent chatbot subsystem.


## Federated expansion: N01–N07 + SARA

The federation boundary is eight identities with distinct authority roles:

| Node | Authority boundary | Android access |
|---|---|---|
| N01 | Android + canonical Mesh | Local/native |
| N02 | Conversation + provider | Through N07 federation |
| N03 | Perception + audio | Through N07 federation |
| N04 | Chat + tools + documents | Through N07 federation |
| N05 | Inference + conversation | Through N07 federation |
| N06 | Cognitive | Through N07 federation |
| N07 | Orchestration + federation + compute | Authenticated HTTPS application boundary |
| SARA | Regeneration + audit + ethics + strategy + memory + rollback + provenance + governance | Authenticated SARA service boundary, normally via N07 or an explicitly configured direct service |

N07 is the seventh runtime/control-plane component, not a replacement for N01–N06. SARA is not N08 and does not replace any SOUL nucleus.

The Android Soul Admin layer therefore does not create seven direct peer clients. It owns the local Android boundary (N01), consumes N07 as the federation control plane, and consumes SARA as the regenerative authority. Remote N02–N06 ownership remains with their native runtimes and is delegated by N07.

### Fusion rule

Functionally similar capabilities may share contracts, telemetry, transport, correlation, health, authorization and adapters. Their native ownership, authority and identity remain distinct.

### Evidence rule

A route declaration is not proof of runtime connectivity. Remote ONLINE requires transport availability, authentication, request/response correlation, validation and health evidence.
