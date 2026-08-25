# Soul Hybrid Architecture — Fusion Baseline

## Core principle

Soul is **not** an Android replacement and must not duplicate Android platform functions.

For this architecture, use the following engineering analogy:

- **Android = CPU / platform substrate**: execution environment, OS services, hardware abstraction and resource scheduling.
- **Soul = GPU / cognitive-perception accelerator**: parallel perception, context fusion, event interpretation, state modeling, orchestration and higher-level intelligence operating above Android.

The analogy is architectural, not a claim that Soul literally implements a GPU.

## Boundary

Soul Sentinel should observe and interpret Android capabilities rather than recreate them. Android remains authoritative for platform operations.

### Soul responsibilities

- perception and sensor/context collection
- event normalization and event bus
- contextual state and self-model
- memory/context aggregation
- cognitive routing/orchestration
- mesh communication with Aeternum, Nexus and Eternium
- health/telemetry of the Soul runtime

### Android responsibilities

- kernel and hardware access
- Wi-Fi/Bluetooth/system controls
- application lifecycle
- display/brightness and platform settings
- process/resource management
- permission enforcement

Soul must request or invoke platform capabilities through supported Android APIs or explicitly authorized bridges such as Shizuku when required. It must not become a second Android control plane.

## Fusion target

The six existing repositories are being consolidated conceptually into one modular system while preserving the Android APK as a first-class application.

Target layout:

```text
soul-aeternum/
  apps/
    web/
    android/
  packages/
    core/
    nexus/
    eternium/
    soul-protocol/
    shared/
  services/
    ai/
    mesh/
    persistence/
  docs/
```

The existing repositories remain untouched until their code is audited and migrated. No source repository is deleted as part of the initial fusion.

## Migration rules

1. Preserve working behavior before refactoring.
2. Identify duplicate implementations before selecting a canonical implementation.
3. Keep Android-specific code inside the Android application/module.
4. Keep web/server code out of the APK.
5. Define shared contracts/events before coupling runtimes.
6. Require build/test evidence before declaring a migrated component functional.
7. Prefer one canonical implementation over parallel copies.
8. Keep rollback points throughout migration.

## Current first-stage integration branch

`integration/soul-fusion-2026-08-25`

This branch is the protected workspace for the fusion baseline. The default `main` branch is not modified by this architectural step.
