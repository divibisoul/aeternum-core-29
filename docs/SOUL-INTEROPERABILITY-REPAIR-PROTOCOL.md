# Soul Interoperability Repair Protocol

N01 is the reference for contracts, identity and interoperability. This protocol is additive: no native nucleus capability, tool or transport is removed or disabled to add another communication path.

## Repair order
1. Inspect the real implementation before changing it.
2. Preserve native capability and tool behavior.
3. Add an adapter when technologies differ.
4. Add a missing transport only when its implementation can be provided safely.
5. Bind transport adapters to the canonical Mesh envelope and correlation ID.
6. Expose capability discovery separately from capability execution.
7. Mark runtime connectivity as unverified until an actual execution environment confirms it.

## Transport model
A nucleus may expose multiple transports simultaneously. Transport negotiation selects a compatible path; it never deletes or disables another available path.

## Capability model
Communication is not capability execution. Every remote capability must resolve through the destination nucleus' native dispatcher/tool runtime. Unknown capabilities return a typed error rather than silently succeeding.

## Failure handling
Adapters should provide timeout, correlation preservation, typed errors and fallback to another compatible transport where policy permits.

## Verification
Structural verification and runtime verification are separate states. CI/build failures are defects to repair, not evidence that an architectural feature should be removed.
