# Soul Mesh — Physical/Logical Connection Topology

## Critical distinction

The seven nucleus repositories remain separate source repositories. The Mesh does NOT magically merge Git directories. It connects their **runtime components** through a shared contract and transport.

The final APK is the integration host: it packages the required runtime modules from N01–N06 into one application process/application boundary. The Mesh is the communication fabric inside that system.

## Current implementation boundary

N01 currently contains the Android/Sentinel Mesh transport implementation. The other nuclei are still separate repositories and must receive compatible Mesh adapters/endpoints before they can be called `CONNECTED`.

Therefore the current state is:

```text
N01 ── Mesh transport/contract ──> [other nucleus adapters: pending]
N02 ── adapter/endpoint pending
N03 ── adapter/endpoint pending
N04 ── adapter/endpoint pending
N05 ── adapter/endpoint pending
N06 ── adapter/endpoint pending
N07 ── adapter/endpoint pending
```

This is intentional: it prevents a false claim that repository-level proximity equals runtime connectivity.

## Target topology

```text
                         SOUL RUNTIME
                              |
                         MESH ROUTER
                              |
       +----------+----------+----------+----------+----------+
       |          |          |          |          |          |
      N01        N02        N03        N04        N05        N06
       |<------ 5 bidirectional peers per nucleus ------->|
```

Every pair is bidirectional. For seven nuclei:

- 21 bidirectional peer pairs;
- 42 directed links;
- 6 inbound + 6 outbound logical channels per nucleus.

## What makes the directories one system

The repositories become one system only when all six runtime domains conform to the same:

1. Mesh protocol;
2. nucleus identity scheme;
3. capability registry;
4. transport interface;
5. request/ACK/response correlation rules;
6. health/handshake protocol;
7. final APK/runtime integration boundary.

## Required adapter work

For each N02–N06, add an adapter that implements:

`MeshEndpoint + ContractValidator + CapabilityRegistry + HealthProbe`.

The adapter must expose an actual receiver and bind it to the nucleus runtime. A route entry alone is insufficient.

## Connection proof

A pair is CONNECTED only after a real test proves:

`N-A -> transport -> N-B -> validation -> capability -> ACK/response -> N-A`

and health reports the pair operational.

## Rule

Do not claim the six nuclei are connected until the 15 bidirectional pairs have evidence. The final APK integration comes after the mesh proves its links, not before.
