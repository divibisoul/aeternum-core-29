# Soul — Integration Model

The seven nuclei are one system because they share one canonical Mesh contract, one capability model, and one routed communication fabric. They remain modular implementations, but their capabilities are exposed through the same protocol.

```text
                 SOUL SYSTEM
                     |
              SOUL MESH CONTRACT
                     |
          +----------+----------+
          |                     |
       ROUTING              CAPABILITIES
          |                     |
   +------+------+------+------+------+
   |      |      |      |      |      |
  N01    N02    N03    N04    N05    N06    N07
   |      |      |      |      |      |      |
 Android  AI    Nexus  Tools  Orchestration Cognition Neural
 Android AI     Nexus AI     Mesh   Support
```

## How a nucleus connects

Each nucleus has one logical Mesh identity and exposes its owned capabilities. A connection is a pair of directed channels:

`A -> B` and `B -> A`.

For seven nuclei there are 21 bidirectional peer pairs / 42 directed peer links. At the interface level this is 6 IN + 6 OUT per nucleus, or 84 channel endpoints.

## How they communicate

1. Source creates a canonical Mesh message.
2. Router selects the target nucleus.
3. Transport sends the serialized message to the target endpoint.
4. Target validates protocol, identity, target and capability.
5. Target dispatches to the capability owner.
6. Target returns ACK/response using the same correlationId.
7. Health and observability record the transaction.

## Why this is one system

The nuclei are not six independent chatbots. They are six execution domains behind a shared contract:

- N01: Android/native capabilities.
- N02: AI interaction/tools.
- N03: Nexus/domain knowledge and fusion.
- N04: AI/chat capabilities.
- N05: AI/tools/mesh capabilities.
- N06: integral support for context, documents, artifacts, tools and communication.
- N07: neural, prefrontal, orchestration and distributed-compute services.

A capability must have one authoritative owner. Other nuclei call it through the Mesh instead of cloning its implementation.

## Important distinction

A peer entry or route declaration is not proof of connectivity. A link becomes operational only after the connection proof sequence:

discovery -> handshake -> authorization -> ping -> request -> ACK -> response -> correlation -> health.

Until then the status is DECLARED or CONFIGURED, never CONNECTED.

## Current implementation strategy

HTTP is the first transport implementation. The protocol and routing layers remain transport-agnostic so the system can later use another transport without changing capability contracts.

## Final APK

The six nuclei are development modules/domains. The final APK packages their runtime components into one Android application. The APK does not turn the nuclei into six applications; it supplies one Soul runtime, one UI, one permission boundary and one Mesh fabric over the seven domains.
