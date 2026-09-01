# Engineering Audit Directive

## Operational rule

Every GitHub intervention must operate on the real state of the system, not on assumptions or on the belief that a previous change worked.

For every affected area:

1. Inspect the current implementation and its dependencies.
2. Identify incomplete, inactive, inconsistent, incorrect, fragile, or disconnected behavior.
3. Correct it, complete it, or replace the faulty implementation with a correct implementation.
4. Use documentation, source code, tests, CI logs, and internet research to find valid solutions and alternatives when a blocker appears.
5. Never stop merely because an error is severe. A blocker becomes a reason to investigate and find a safe technical path forward.
6. Validate the change with the strongest practical checks available: typecheck, lint, unit/integration tests, build, and runtime verification where possible.
7. Re-read the resulting repository state after the change and verify that the claimed correction actually exists.
8. Do not report a task as complete because code was written; report completion only after objective validation.
9. Maintain a visible progress/time/status record for substantial audits so that delivery decisions reflect actual remaining work and system health.
10. Preserve valid original intent while correcting implementation defects; do not delete functionality simply because it is unfamiliar or incomplete.

## Completion standard

An area is considered complete only when it is implemented, connected to its intended interfaces, validated, and consistent with the surrounding architecture. If any of those conditions are false, the audit continues.
