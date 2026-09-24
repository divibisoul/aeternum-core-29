# Soul / Aeternum Integration Status

This document tracks the recovery and integration work toward an Android APK.

## Current baseline
- Repository: `divibisoul/aeternum-core-29`
- Stack: Vite + React + TypeScript
- Android project: not present in the current repository baseline
- Capacitor: not present in the current repository baseline
- Native Android bridge: not present in the current repository baseline

## Integration targets
1. Consolidate reusable Aeternum/Nexus/Eternium capabilities.
2. Establish a canonical Soul hybrid application shell for web + native app surfaces.
3. Keep the Android build layer as one native platform adapter without exposing secrets in the app.
4. Add native perception/device capabilities only through explicit platform bridges.
5. Produce and validate web/PWA and native app builds independently.

## Platform scope

Web/PWA and native App are first-class delivery surfaces over the same platform-neutral SOUL core. Android remains supported through the existing native bridge and is not the definition of the SOUL runtime.

## Status
- Repository ownership/access: 100%
- Initial repository inventory: 100%
- Cross-repository architectural mapping: 25%
- Duplicate/obsolete code classification: 15%
- Soul canonical core: 10%
- Android project/build layer: 0%
- Native Android perception layer: 0%
- Secret/configuration hardening: 10%
- APK build pipeline: 0%
- Device installation validation: 0%

## Rule
Do not delete legacy implementations until their functionality has been mapped and a replacement has been validated.