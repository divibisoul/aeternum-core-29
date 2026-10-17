# Soul Mesh — Implementation Status

## Logical channel contract

- Operational AI nuclei: N01, N02, N03, N04, N05 and N06.
- N07 remains a recognized structural/control-plane identity in the wire contract; it is not counted as a seventh operational AI nucleus.
- Six operational nuclei × five peers each = 30 unique directed requests and 15 unordered bidirectional peer pairs.
- Every directed request has two endpoint surfaces: one OUT surface on the sender and one IN surface on the receiver. The contract inventory therefore contains exactly 30 OUT + 30 IN = 60 directional surfaces.
- Slot numbers are local to the owning nucleus and identify the peer in the canonical N01–N06 order. A directed request is not multiplied into five duplicate slot IDs.

## N01 APK probe semantics

The APK can initiate probes for its local OUT surfaces and the corresponding remote IN surfaces reached by requests from N01. A local IN surface requires the remote peer to initiate traffic; a remote OUT surface or remote-to-remote surface requires a probe from another owner. Those cases are reported as not probeable from N01, never as reachable. Endpoint configuration alone is not a successful probe.

The probe uses mesh.ping as a transport diagnostic only. A successful ping does not prove execution of an AI capability.

## Runtime endpoints

N01: Android/in-process runtime, Mesh message contract and HTTP transport are present; cross-repository live proof is tracked separately.
N02: Mesh route/runtime code is present; cross-repository live proof is tracked separately.
N03–N06: Mesh route/runtime and adapter code is present in their respective repositories; cross-repository live proof remains pending.

## Live connectivity

0/15 bidirectional peer pairs have been proven by real cross-repository traffic in the evidence reviewed for this status.
0/30 unique directed requests have been proven end-to-end.
These figures describe demonstrated live connectivity, not the presence or absence of logical routes.

## Current build order

1. Verify the existing N02 adapter against the shared Mesh contract.
2. Verify N03–N06 without replacing their existing capabilities.
3. Bind each verified runtime to a transport appropriate to its execution environment.
4. Execute real end-to-end traffic for every directed link.
5. Mark a directed link PASS only after request → transport → runtime → handler → response → correlation has been observed.

## Non-negotiable rule

Do not report a link as connected merely because its logical channel, endpoint, adapter, or route exists. A connection is connected only when real traffic completes successfully in that direction.
