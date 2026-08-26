# Soul Mesh — Direct peer communication contract

This is an implementation contract, not a simulation. The Soul is a hybrid GPU/fabric: nuclei remain specialized execution domains and communicate directly through the Mesh transport. N01/Cockpit/Pilot may orchestrate, but they are not a mandatory relay for nucleus-to-nucleus traffic.

## Canonical runtime path

`Source nucleus -> direct transport -> target nucleus /api/soul-mesh -> validation -> capability handler -> ACK/response -> source nucleus`

The same contract is usable from Android/native, WebView and server runtimes. HTTP is the concrete inter-runtime transport today; the envelope is transport-independent so additional realtime transports can be added without changing nucleus semantics.

## Direct-peer invariant

Each nucleus has exactly five peer identities and five outbound logical slots plus five inbound logical slots. A peer link is addressed directly to the target runtime endpoint. A Cockpit/Pilot relay is optional orchestration and must never be required for peer-to-peer communication.

For a message from `N-A` to `N-B`:

- `source = N-A`;
- `target = N-B`;
- `channelId = N-A.OUT.[1..5].N-B`;
- target accepts only channels addressed to itself;
- response preserves the request `correlationId`;
- proof is `EXECUTED` only after the target handler ran.

The reciprocal inbound identity is `N-B.IN.[1..5].N-A`.

## 60-channel model

Six nuclei × five outbound slots = 30 outbound logical channels. Six nuclei × five inbound slots = 30 inbound logical channels. Total = 60 directional channels.

There are 15 unordered peer pairs and 30 directed peer links. Each directed peer link owns five logical slots, producing 150 slot-level request paths when all five slots are exercised per directed link. The 60 figure therefore refers to the six-nucleus port/channel contract, not to 60 unique unordered network edges.

## Proof gate

A channel is LIVE only after real runtime traffic proves:

`request -> direct transport -> target receiver -> validation -> handler -> response/ACK -> matching correlationId -> EXECUTED proof`.

Configuration, route declarations, documentation, capability names, or a successful local mock do not satisfy this gate.

## Hybrid APK and Cockpit

The APK is the user/device boundary and can access all 60 channels directly through the native/Web hybrid Mesh layer. The Cockpit/Pilot can inspect and command all channels directly. Neither component replaces peer-to-peer nucleus communication.

## No false-positive rule

Never report `60/60`, `CONNECTED`, or `SYNERGY VERIFIED` from topology counts. Those states require runtime evidence. Missing deployment endpoints are a deployment problem, not permission to emulate the result.
