# SOUL Collaboration Protocol — engineering-time coordination

**Authority:** GitHub repository state + committed code + executed validation. Conversation memory is not evidence.
**Last reconciled:** 2026-09-30
**Runtime boundary:** GitHub coordinates engineering work; the Soul Mesh coordinates runtime traffic.

## Operating loop

READ → CLAIM → MODIFY → VALIDATE → HANDOFF → CONSUME

Never infer another front is idle. Before modifying a shared contract, inspect the latest peer implementation and preserve incompatible-but-useful work until reconciliation is explicit.

## Evidence states

- **IMPLEMENTED:** code exists.
- **CI_VALIDATED:** automated validation actually executed successfully.
- **ONLINE_VERIFIED:** real deployed runtime interaction observed.
- **BLOCKED_ENV:** required external runtime/secret/infrastructure is absent.
- **UNMEASURABLE:** evidence source is unavailable.
- **RECOVERY_PENDING:** historical component is preserved but not yet reattached to the canonical runtime.

File presence, HTTP 200, ping, or a test-only mock never upgrades an evidence state to ONLINE_VERIFIED.

## Parallel work

N01↔N02, N03↔N04, N05↔N06 are independent lanes. Shared-contract changes are reconciled at the integration boundary. Each completed handoff records changed paths, commit SHA, validation, capabilities affected, dependencies unlocked, blockers and next dependent task.

## Non-destructive rule

Do not delete historical implementations, replace working authorities with parallel copies, or invent successful runtime evidence. Prefer additive adapters, explicit state, compatibility layers and reconciliation commits.

## Current integration bottlenecks

1. N07 canonical learning receiver must be present on MAIN so learning emitted by N02–N06 has a real destination.
2. Several long-lived PR branches diverge substantially from MAIN and require reconciliation rather than blind merge.
3. Runtime federation gates remain distinct from source-level implementation and must be proven with real endpoints.
4. Coordination handoff files must remain updated after each material change.

See N01 issue #11 for the six-front topology and stages.
