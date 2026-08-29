# N01 Completion Matrix

## Scope
N01 is an independent AI nucleus. Existing Android functionality remains authoritative; Soul Mesh adds cooperative discovery, authenticated messaging, capability authorization, delegation boundaries, and provider adaptation without creating a parallel API architecture.

| Area | State | Evidence / closure criterion |
|---|---|---|
| Identity | READY | N01 is represented explicitly by Mesh contracts |
| Capability graph | READY | Existing graph + authorization boundary |
| Mesh envelope | READY | Canonical v1 envelope + HMAC verification |
| Authorization | READY | CapabilityAuthorization + task validation |
| Runtime gate | READY | N01RuntimeGate authenticates then authorizes |
| Provider abstraction | READY | Provider-neutral contract and scheduler present |
| Browser/session boundary | READY | Existing bridge architecture preserved |
| Android transport security | IMPLEMENTED | Network Security Config denies cleartext except localhost development endpoints |
| Inbound execution | STRUCTURAL | Runtime gate exists; concrete app dispatch still requires runtime wiring |
| Outbound delegation | STRUCTURAL | Mesh router/transport selection exists; concrete cross-nucleus dispatch requires runtime transport |
| N01↔N02 live transaction | PENDING RUNTIME | Requires executable paired N02 endpoint and device/network runtime |
| Build verification | PENDING RUNTIME | Must be executed in Android/CI environment |

## Closure rule

N01 is closed for structural engineering when every non-runtime row is READY/IMPLEMENTED and every environment-dependent row is explicitly marked STRUCTURAL or PENDING RUNTIME. Runtime-only items do not reopen the architecture; they are commissioning checks.

## Change-control rule

New findings discovered during execution are classified as REQUIRED NOW, BACKLOG, or RUNTIME VALIDATION. Only REQUIRED NOW changes are allowed to expand the active implementation scope.
