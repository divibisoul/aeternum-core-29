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
2. Establish a canonical Soul application shell.
3. Add an Android build layer without exposing secrets in the APK.
4. Add native perception capabilities only through explicit Android bridges.
5. Produce and validate a signed/debug APK build.

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
