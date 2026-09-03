# SOUL — LIVE EXECUTION STATE

Last updated: 2026-09-03

This is the N01 continuous execution control board. Every state transition requires repository evidence and validation evidence. A new prompt continues this state; it does not create a new project or parallel implementation.

## Current floor: N01

| ID | Stage | Status | Evidence / current state |
|---|---|---|---|
| N01-01 | Baseline/source audit | COMPLETE | Main `6c828648fb2d953f609218d612501102566684fc` audited before modification. |
| N01-02 | Canonical transport | IMPLEMENTED / VALIDATION OPEN | `CanonicalTransportAdapter` added; `MeshRouter` delegates transport choice to the existing `HybridTransportRegistry`. |
| N01-03 | Capability authority | IMPLEMENTED / VALIDATION OPEN | `N01CapabilityBridge` + self-test adapt the existing `CapabilityGraph`; no second registry created. |
| N01-04 | Fast-inference routing | IMPLEMENTED / VALIDATION OPEN | Existing prefrontal/neural routing now carries an explicit `fast_inference` signal toward accelerated nuclei. |
| N01-05 | Soul Sentinel | IMPLEMENTED / VALIDATION OPEN | Existing `SoulAdminService` hardened as watchdog; default enabled; boot/package-replacement receiver registered; Core/Mesh integrity telemetry and bounded restart added. |
| N01-06 | Seven-nucleus topology | CORRECTED / VALIDATION OPEN | Structural contract is 7 nuclei × 6 peers = 42 directed links and 21 bidirectional pairs. Previous `84` value was endpoint counting, not directional-link count. |
| N01-07 | Environment security | PRESENT | `.env` remains ignored and `.env.example` is the tracked template; no secret values were introduced. |
| N01-08 | Regression validation | BLOCKED BY ACTIONS EXECUTION | Latest direct branch run `SOUL N01 validation #404` failed with all six jobs ending `failure` and `steps:null`; re-run reproduced the same pattern. Mesh regression and Android build also fail before any visible step execution. Job logs return `BlobNotFound`. |
| N01-09 | N01↔N02 runtime transaction | OPEN | Requires actual deployed peer endpoints and a real correlated request/response. |
| N01-10 | Final N01 certification | BLOCKED | No PASS/HEALTHY/ONLINE/merged claim is permitted until executable evidence exists. |

## Verified consolidation commits

- `4cc78a56e572a3c14dc915203ae3d3a3e330e5c2` — canonical transport adapter.
- `21ba25fd15785a80c7a52adc68a9f3f3b8ef8517` — canonical MeshRouter integration.
- `7cd0eebd0505fc9c5921120bdf15a40094896ee0` — canonical N01 capability bridge.
- `8ef2eae3813b2fa69ef2f300f31e389263b279d1` — capability bridge self-test.
- `b09d773706fa0f0099b92648eeb7ea1b76d3bc6e` — fast-inference routing in N01 prefrontal routing.
- `b030944550efb1d7c6da4274e64c8c3f9ca14a06` — fast-inference priority in neural graph.
- `2f43f2c9a444412c2fa49d13941def2f2dd8d3eb` — Sentinel boot/package-replacement registration.
- `0c318dbc9a7d384ea4453ed10406e46e47467514` — Sentinel enabled by default.
- `60e1091dd52a40578521d30d2fba08f412e9ac8a` — Sentinel Core/Mesh integrity telemetry.
- `feaf9b98e26968024ec4d64930d471438a02d5a2` — Sentinel watchdog and bounded restart.
- `7a1423909ce37810b2bbf4b98651df230eb075ae` / `c9afe03900b2c0dcbb13c0762d76c04f4bc3d099` — Sentinel startup while preserving the hybrid activity implementation.
- `f877a0ff4543655048b6ca6c0a57a0b6c49db520` — Sentinel boot/package-replacement handling.
- `66bd0c38feb90c3e5299e1a1bab3031c3e856334` — 42-link regression and Sentinel topology coverage.
- `d68cddbd491b4b713afe96017b656b2989310ab0` — corrected fusion registry directional-link count.
- `0a54231807a52916fb938886409b94203cd94c93` — corrected fusion contract checker.
- `ccecb3fa1722cf675d89e67c3759cd85feeb3a19` — corrected runtime fusion diagnostic topology.
- `f7ad68f7ca780e76c2bb12e137109570c6527d05` — consolidated architecture and PR classification documentation.
- `360c4959b20437e569f31cb21cb34900bf20e350` — strict validation workflow restored with runner forensics, transport/capability/fusion checks and diagnostics.

## PR classification for the 13 historical N01 PRs

- **Canonical / absorbed:** #15.
- **Complementary / selectively absorbed:** #24, #20.
- **Already absorbed by main/canonical implementation:** #18, #1, #2, #7, #8, #9.
- **Retained as historical evidence; no duplicate authority created:** #21, #19, #6, #4.

The branches remain preserved. Historical PRs are not closed until the consolidated line is executable and the resulting classification is machine-validated.

## CI infrastructure finding

GitHub's status API currently reports Actions operational. However, the N01 branch's six validation jobs, Android build, and Mesh regression are repeatedly recorded as failed without any job steps, and their log retrieval returns `BlobNotFound`. The same immediate failure/no-step pattern is observable in another private SOUL repository. This does not prove the cause, but it strongly indicates an account/repository runner eligibility, billing, or configuration boundary rather than a source-level test failure. GitHub documentation confirms that private repositories using GitHub-hosted runners are subject to account quotas/billing and that usage can be blocked when the quota/payment conditions are not satisfied.

## Anti-loop rule

Before every subsequent N01 action, re-read this file, compare `consolidacao-n01` against `main`, inspect the latest GitHub execution evidence, and continue from the latest verified SHA. Never restart analysis from an old prompt, never create a third solution for an existing responsibility, and never claim PASS/ONLINE without execution evidence.

## Single next executable action

Resolve the GitHub Actions execution boundary for this private repository/account, then rerun the existing N01 validation. Once jobs actually execute, fix every source-level failure on `consolidacao-n01` and keep the same PR #25. Do not start N02 and do not create another N01 PR.
