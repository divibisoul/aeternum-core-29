# Connection 1/6 — Sentinel ↔ Aeternum Core

## Purpose
Connect Android perception to the Aeternum Core without reimplementing Android capabilities.

## Runtime path
Android APIs → Soul Sentinel → SoulNativeBridge.kt → WebView DOM event → AndroidSoulBridge.ts → Nervo Vago EventBus → Aeternum Core.

## Implemented
- Versioned Sentinel event contract.
- Native WebView bridge and lifecycle registry.
- Core WebView embedded in Sentinel.
- Aeternum Core bridge starts at web runtime boot.
- Sentinel publishes `android:ready` and normalized context updates.
- Battery percentage is currently published as the first real perception signal.
- Core maps Sentinel context to existing `telemetry:update` events.
- Unified build now builds Aeternum Core and packages its `dist` into the Android APK assets.
- Bridge is one-way for this connection: Sentinel → Core. Privileged Core → Android execution is intentionally reserved for a later Guardian/command contract.

## Function / benefit
The Soul gains a real perception channel. Aeternum can receive Android context without duplicating Android services. This enables contextual decisions based on device state and provides the foundation for later capabilities to consume the same events.

## Verification state
Implementation: 90%
Runtime build verification: pending GitHub Actions run.
Device verification: pending APK installation.

## Exit criterion
100% only after a successful unified APK build demonstrates the bundled Core receives a Sentinel event at runtime.
