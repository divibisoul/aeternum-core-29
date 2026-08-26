# Soul Mesh — How the nuclei communicate

## One sentence

The six repositories are source modules; the **Soul runtime** loads their runtime components, gives each one a Mesh identity/endpoint, and connects them through a common router + transport + protocol. They communicate by structured messages, not by sharing directories.

## Concrete path

```text
N01 capability
   |
   | SoulMeshMessage
   v
MESH ROUTER
   |
   | target=N04
   v
TRANSPORT ADAPTER
   |
   | HTTP POST /mesh/message (current implementation)
   v
N04 MESH ENDPOINT
   |
   +--> validate contract
   +--> authorize capability
   +--> dispatch to N04 capability
   |
   | ACK / response
   v
TRANSPORT
   |
   v
ROUTER
   |
   v
N01 correlationId
```

## What is physically connected

A runtime endpoint is a real communication point. The endpoint receives bytes/messages and invokes the nucleus dispatcher. The repository itself is not the endpoint.

Therefore each nucleus needs:

```text
Nucleus runtime
  + MeshEndpoint
  + ContractValidator
  + CapabilityRegistry
  + HealthProbe
  + Transport adapter
```

N01 currently contains the first concrete Android transport implementation. N02–N06 still require compatible runtime adapters/endpoints before their links can be proven.

## Why the nuclei can understand each other

They do not exchange arbitrary internal objects. They exchange the canonical `soul-mesh/1` envelope:

```text
protocol
id
correlationId
source
 target
kind
capability
payload
timestamp
```

The `capability` identifies what service is being requested. The receiver executes its local implementation and returns a result. This keeps implementations independent while making the system interoperable.

## Example

If N03 needs a document capability owned by N06:

```text
N03
 | request capability=document.read
 v
Router
 | target=N06
 v
N06 endpoint
 | validate + authorize
 v
N06 document service
 | result
 v
N06 endpoint
 | response(correlationId=X)
 v
Router
 v
N03
```

N03 never needs to know N06's internal class/file layout.

## Six-nucleus topology

```text
             N01 <------> N02
              | \        / |
              |  \      /  |
              |   N03-----N04
              |    | \   / |
              |    |  \ /  |
              +----N05----N06
```

The diagram represents the complete peer graph conceptually; actual links are only marked CONNECTED after runtime proof.

## Connection states

`DECLARED` → route exists in configuration

`DISCOVERED` → endpoint responds to discovery

`HANDSHAKEN` → both sides agree on protocol/identity

`AUTHORIZED` → capability access permitted

`CONNECTED` → request → ACK → response was proven

`HEALTHY` → connected link continues to pass health checks

## Final APK

The final APK is the host/runtime that assembles the six domains. It does not require six APKs. The six source repositories remain independently maintainable, while their runtime modules are integrated into one Soul application and communicate through the same Mesh abstraction.
