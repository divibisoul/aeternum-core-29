# Soul — Direct Peer Mesh Implementation 2026-08-26

## Purpose

The Soul is a hybrid GPU/fabric, not a conventional CPU pipeline. Nucleus-to-nucleus communication must therefore be direct, bidirectional, transport-backed and independently executable. N01/Cockpit/Pilot may orchestrate, but they are not a mandatory relay between peer nuclei.

## Implemented in this reconstruction step

- N03 runtime receiver hardened for direct peer traffic.
- N06 runtime receiver hardened for direct peer traffic.
- N03 and N06 now expose executable `mesh.handshake`.
- N03 and N06 now expose direct five-slot outbound peer probes.
- N03/N06 probes execute the five peer targets in parallel and require HTTP success, matching correlationId, reciprocal source/target identity, channelId preservation and `EXECUTED` proof.
- N02/N04/N05 mesh handlers now expose executable `mesh.handshake`.
- N02/N04/N05 endpoint validators now require the canonical five-slot channel form and return true receiver identity for handshake ACKs.
- N01 communication contract now defines direct peer communication as canonical.
- Legacy channel aliases are no longer accepted by the updated N02/N04/N05 validators.

## Channel semantics

For every ordered peer pair A -> B there are five outbound slots:

`A.OUT.1.B` through `A.OUT.5.B`

The receiver accepts the corresponding inbound form:

`B.IN.1.A` through `B.IN.5.A`

The six-nucleus topology contains 15 unordered peer pairs and 30 directed peer links. The six nuclei each expose five inbound and five outbound logical slots, yielding 60 directional channel ports. The runtime may multiplex traffic over HTTP today and can add realtime transports without changing the envelope contract.

## No false positive

This commit set proves implementation of the direct communication path, not deployment. A live `60/60` claim remains forbidden until all six runtime domains are actually deployed/reachable and every ordered peer link produces real request -> target handler -> response/ACK -> correlation evidence.

The direct-peer probes intentionally fail when an endpoint URL is missing. They never emulate a peer or mark a configured-but-unreachable endpoint as connected.

## Next execution gate

1. Deploy N01–N06 runtime receivers with real endpoint URLs.
2. Configure each nucleus with the five peer URLs.
3. Run outbound five-slot probes from each nucleus.
4. Collect 30 directed-link proofs and 60 directional channel proofs.
5. Run capability-level E2E tests.
6. Run composed parallel synergy tests.
7. Only then mark the Cockpit global mesh state as verified.
