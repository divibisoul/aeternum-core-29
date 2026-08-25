# Fusion Status

Date: 2026-08-25

## Phase 0 — Baseline

- [x] Create isolated integration branch
- [x] Establish Soul/Android architectural boundary
- [x] Preserve original repositories
- [ ] Complete six-repository dependency and code inventory
- [ ] Define canonical modules
- [ ] Migrate non-duplicate code
- [ ] Integrate mesh contracts
- [ ] Validate web build
- [ ] Validate Android build
- [ ] Produce APK artifact
- [ ] End-to-end runtime validation

## Current canonical candidate

`aeternum-core-29` is the current integration host because it already contains the web application and the `soul-sentinel` Android application.

This is a working hypothesis, not a final architectural decision.

## Android/Soul rule

Soul Sentinel remains an Android APK. It is the Soul runtime/perception layer above Android, not a replacement for Android platform services.

## Safety against accidental loss

No original repository is deleted, renamed, or force-rewritten during Phase 0.
