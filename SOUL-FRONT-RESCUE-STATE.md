# SOUL — FRONT RESCUE STATE (N01)

**Updated:** 2026-10-18 UTC  
**Scope:** N01 only — foundation continuity, HortaCore authority and Mesh integration.  
**State:** IN PROGRESS; no merge authorization.

## Start point

- N01 `main` baseline: `d5932bbe9e91127d497e86acd32bbb305e0c14d6`.
- Cross-front baseline read from `SOUL-HANDOFF.md`: N01 owns the canonical HortaCore/Aeternum state authority and native modules. N07 may expose corresponding control/catalog boundaries but must not create a competing N01 authority.
- The repository did not contain this checkpoint file on the `main` or candidate refs checked during this cycle. This file is added as a new file; it does not replace an existing state document.
- The 291-PR ledger is tracked by N07 PR #157: https://github.com/divibisoul/Orquestrador-/pull/157. Enumeration is complete; functional reconciliation and the overall fusion are not complete.

## Active unit of work

- **Only fusion candidate for this N01 unit:** PR #106 — https://github.com/divibisoul/aeternum-core-29/pull/106
- Branch: `fusion/n01-hortacore-clareira-mesh-20261016`.
- Baseline head before this correction: `41c9f28638007ccae83edced5b2638739ee34414`.
- Functional cluster: current HortaCore authority + preserved legacy facade + Vagus/Clareira continuity + canonical Mesh contract/registration + Android and container contract provenance.
- Related source PRs remain open. No source PR or branch may be closed, deleted, or marked ABSORBED until the candidate has passed the required CI on its exact final SHA and the source deltas have been reconciled.

## Last observed validation on the baseline head

- N01↔N04 real-process E2E run #38985712529 failed during `npm ci`, before either service started and before any E2E assertion executed.
- The install error reported an inconsistent/unresolvable top-level lock entry for `node_modules/picomatch`: candidate lock `2.3.2`, while the N01 main lock records `2.3.1`. The root dependency/devDependency maps in `package-lock.json` matched `package.json`.
- Buried Aeternum recovery run #38985712530 ended in failure in `verify-buried-aeternum-recovery.mjs`; this is a separate failed gate and remains unresolved until its logs are assessed.
- Twenty other checks were cancelled during the previous validation cycle. Cancelled checks are not PASS.

## Current bounded correction

1. Correct only the `node_modules/picomatch` lock entry using the entry already present in N01 `main`; retain all other lock resolutions and leave `package.json` unchanged.
2. Keep the existing N01↔N04 E2E and update its pinned N04 source/assertion to the then-current N04 PR #51 head, so the next run tests an explicit current candidate.
3. Re-run on the new exact N01 #106 SHA. Require the installation step to pass, both real production builds to pass, and the E2E to show successful authenticated traffic in both directions. Inspect failures instead of interpreting skipped tests as PASS.
4. Assess the separate recovery-verification failure before declaring N01 fusion validation complete.
5. Keep #106 draft/unmerged and retain all source PRs until all required exact-head gates are green.

## Cluster classification

All classifications below remain **PENDING RECONCILE** until CI is green on the exact final fusion SHA and file/function provenance is confirmed:

- #95 HortaCore facade.
- #96 truthful anti-fabrication semantics.
- #97 Digital Vagus and Clareira native integrations.
- #98 single vascular HortaCore authority.
- #99 dual-runtime canonical Mesh contract.
- #100 HortaCore/Vagus/Mesh aggregate frontier.
- #101 Android instrumentation compile fix.
- #102 Mesh channel and structural N07 policy.
- #103 Android contract fixtures.
- #104 Mesh container path.
- #105 canonical Mesh/retry identity/Android ownership.

#106 is **KEEP / sole fusion candidate**. #107 resource telemetry is a separate cluster and is outside this unit of work. No source PR is classified ABSORBED or SUPERSEDED by this checkpoint.

## Handoff

**WHAT_CHANGED:** checkpoint and lockfile correction are grouped into one candidate commit; N01 E2E source pin is synchronized to the current N04 PR #51 SHA observed at time of correction.

**WHAT_REMAINS:** exact-head `npm ci`, N01/N04 production builds, bidirectional E2E and separate recovery-gate diagnosis.

**NEXT_ACTION:** inspect exact-head GitHub Actions after the new commit. If a required run is QUEUED/PENDING, do not stack another change. If a check fails, capture its concrete log and fix only on this branch after the run ends.

**PR_NUMBER:** 106  
**BASELINE_SHA:** 41c9f28638007ccae83edced5b2638739ee34414  
**CURRENT_SHA:** read live from PR #106 after the checkpoint commit; do not infer it from this file.  
