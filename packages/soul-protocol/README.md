# Soul Protocol

Shared contract between the Soul Android node, Aeternum Core, Nexus and Eternium.

This package defines **events and capabilities**, not Android system-control implementations.

## Design

Android remains the platform/CPU substrate. Soul acts as the cognitive/perception accelerator above it.

Messages should describe observations, context, capabilities, requests and results. They should not silently turn Soul into a second Android control plane.

## Initial message classes

- `observation` — normalized perception from Android/sensors/runtime
- `context` — current contextual state
- `capability` — capability advertisement/health
- `intent` — high-level requested action
- `result` — outcome of an intent
- `health` — runtime/mesh health

## Transport neutrality

The protocol must remain independent of HTTP, WebSocket, Binder, Shizuku or any single transport. Transport adapters belong to the runtime modules.
