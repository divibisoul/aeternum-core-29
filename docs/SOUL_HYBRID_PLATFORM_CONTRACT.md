# SOUL Hybrid Platform Contract v1

## Canonical position

SOUL is a platform-agnostic system with a hybrid delivery model.

The core contracts, cognition, federation, audit, memory, orchestration and
regenerative authority must not depend on Android, a browser, a specific UI
framework, or a specific model provider.

## First-class surfaces

| Surface | Role | Authority |
|---|---|---|
| Web | Browser/PWA user interface and web-hosted runtime adapters | Consumes the shared SOUL contracts |
| App | Native application shell and device adapters | Consumes the shared SOUL contracts |
| Android | Native device/privileged adapter when available | N01-owned adapter; never the core authority |
| Future iOS/desktop | Additional platform adapters when implemented | Same shared contracts |

Android remains supported and is not removed. The existing Android bridge and
Soul Sentinel project remain valid platform-specific implementations.

## Boundary

```text
                  +----------------------+
                  |      SOUL CORE       |
                  | platform-agnostic    |
                  | contracts / mesh /   |
                  | cognition / context  |
                  +----------+-----------+
                             |
            +----------------+----------------+
            |                                 |
      +-----v------+                    +-----v------+
      |    Web     |                    |    App     |
      | browser/PWA|                    | native     |
      +------------+                    +------+-----+
                                               |
                                      +--------v--------+
                                      | platform adapter|
                                      | Android / ...   |
                                      +-----------------+
```

SARA remains the regenerative and ethical authority. N07 remains the federated
orchestration boundary. Platform adapters provide capabilities; they do not
replace either authority.

## Context compatibility

The SARA context field `client` is transport metadata, not a platform lock.
Recognized examples include `web`, `app`, `android`, `ios`, `desktop`, `pwa`,
`n04`, `n06`, `n07`, and `collaboration`. Unknown future platform labels remain
forward-compatible because the context contract is extensible.

## Non-destructive rule

The current Android bridge, Soul Sentinel, and existing web runtime are
preserved. Platform-neutral additions must compose with them rather than
delete, fork, or silently replace them.

## Acceptance evidence

A platform implementation is considered real only when its executable handler,
contract, routing path, validation and tests exist. Documentation or a declared
capability alone is not runtime evidence.
