# SOUL baseline CI evidence — Phase Zero

**Capture date:** 2026-10-19 local date (the listed workflow timestamps are UTC).  
**Rule:** only a workflow run whose `head_sha` exactly matches the frozen SHA is evidence for that SHA. A newer queued run is not PASS. A successful scheduled health task is not a substitute for a build or E2E test.

## N01 — aeternum-core-29

Frozen SHA: `d5932bbe9e91127d497e86acd32bbb305e0c14d6`

| Workflow | Run | Result | Meaning |
|---|---|---|---|
| SOUL 25 Capability Upgrade - N01 | [39357578136](https://github.com/divibisoul/aeternum-core-29/actions/runs/39357578136) | **QUEUED** | Latest observed run for the exact baseline; not PASS. |
| SOUL N01 validation | [39192471943](https://github.com/divibisoul/aeternum-core-29/actions/runs/39192471943) | **PASS** | Validation workflow passed on the exact SHA. |
| SOUL 25 Capability Upgrade - N01 | [39190237195](https://github.com/divibisoul/aeternum-core-29/actions/runs/39190237195) | **PASS** | Prior capability-upgrade workflow passed on the exact SHA. |
| Soul N01 Full Build | [39191658781](https://github.com/divibisoul/aeternum-core-29/actions/runs/39191658781) | **FAIL** | Web TypeScript/Vite lint/build succeeded; Android APK debug/release and APK-output checks succeeded; the Android Mesh instrumentation step failed. |

### N01 failure classification

The failed job is `Android APK + Mesh instrumentation`, job ID `117865590099`. The decoded workflow log records repeated `adb: device offline`, followed by an emulator `Broken pipe (32)` / ADB exit code 224 during teardown. The emulator reports boot completion after approximately 17 minutes. The other build steps listed above passed.

**Classification:** primarily **ENVIRONMENT / CI** evidence (Android emulator/ADB lifecycle), not yet evidence of a deterministic Mesh code defect. The instrumentation step itself is FAIL and must be re-run against the same or an explicitly new SHA before N01 Full Build can be called PASS. Do not suppress the test or turn the failed step into SKIP.

## N03 — nexus-aeternum-fusion

Frozen SHA: `676c20cb5e537944a5a75d8e4920ff48c010cfbf`

| Workflow | Run | Result |
|---|---|---|
| Soul Mesh CI | [38827333387](https://github.com/divibisoul/nexus-aeternum-fusion/actions/runs/38827333387) | **PASS** |
| SOUL Integration CI - N03 | [38827333461](https://github.com/divibisoul/nexus-aeternum-fusion/actions/runs/38827333461) | **PASS** |
| Nexus Soul Bridge Build | [38827333507](https://github.com/divibisoul/nexus-aeternum-fusion/actions/runs/38827333507) | **PASS** |
| SOUL 25 Capability Upgrade - N03 | [38827333338](https://github.com/divibisoul/nexus-aeternum-fusion/actions/runs/38827333338) | **PASS** |
| N03 validation diagnostics | [38827333471](https://github.com/divibisoul/nexus-aeternum-fusion/actions/runs/38827333471) | **PASS** |

This is positive build/validation evidence for N03 at the frozen SHA. It does **not** independently prove that Google Speech, Google TTS and Hugging Face provider adapters all use real provider credentials or pass a real external-service E2E test. The requested provider-specific tests remain unproven unless those exact test names and artifacts are identified.

## N07 — Orquestrador-

Frozen SHA: `5fd4e95d4e2bffb7fd1028da00cdbf7b4f66e49a`

| Workflow | Run | Result |
|---|---|---|
| N07 E2E Commissioning | [38824007186](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007186) | **PASS** |
| N07 Orquestrador CI | [38824007185](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007185) | **PASS** |
| SOUL Integration CI - N07 | [38824007196](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007196) | **PASS** |
| SOUL Blueprint Contract | [38824007162](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007162) | **PASS** |
| SOUL External Ownership + Resident Contract CI | [38824007195](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007195) | **PASS** |
| Aeternum Functional Authority Crossfront | [38824007163](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007163) | **PASS** |
| SOUL 25 Capability Upgrade - N07 | [38824007243](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007243) | **PASS** |
| N07 Production Container Publish | [38824007200](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007200) | **PASS** |
| pages build and deployment | [38824007341](https://github.com/divibisoul/Orquestrador-/actions/runs/38824007341) | **FAIL** |

N07 has meaningful E2E and CI evidence on its frozen SHA. The Pages deployment failure is recorded rather than hidden; it does not by itself imply the Go service tests failed. The combined status endpoint returned no commit statuses for the three baselines, so its empty array is **not** treated as PASS.

## Phase Zero conclusion

- N01: **PARTIAL**; source validation passes, but one full-build instrumentation job failed for an apparent emulator/ADB environment failure and the latest capability-upgrade run remains queued.
- N03: **PARTIAL**; all five listed CI workflows pass on the baseline SHA; provider-specific real external-service E2E remains unproven.
- N07: **PARTIAL**; E2E commissioning and service CI pass; the Pages workflow failed and cross-group A↔N01↔N07 acceptance is not established by this evidence alone.
- Full Group A integration and the required input → A → B → C → F → G → response E2E: **NOT RUN / NOT PASS**.
