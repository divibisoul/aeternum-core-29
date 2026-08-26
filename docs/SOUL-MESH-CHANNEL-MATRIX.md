# Soul Mesh — Complete 60-Channel Matrix

The six nuclei expose exactly five logical OUT ports and five logical IN ports each.

That produces:

- 30 logical OUT channels;
- 30 logical IN channels;
- 60 directional logical channels;
- 15 bidirectional nucleus pairs.

| Nucleus | OUT peers | IN peers |
|---|---|---|
| N01 | N02,N03,N04,N05,N06 | N02,N03,N04,N05,N06 |
| N02 | N01,N03,N04,N05,N06 | N01,N03,N04,N05,N06 |
| N03 | N01,N02,N04,N05,N06 | N01,N02,N04,N05,N06 |
| N04 | N01,N02,N03,N05,N06 | N01,N02,N03,N05,N06 |
| N05 | N01,N02,N03,N04,N06 | N01,N02,N03,N04,N06 |
| N06 | N01,N02,N03,N04,N05 | N01,N02,N03,N04,N05 |

## Hybrid transport requirement

Every logical IN/OUT channel is transport-neutral. At runtime a channel may negotiate one of:

- `WEBVIEW_BRIDGE` — Android APK ↔ WebView;
- `LOOPBACK_HTTP` — same-device runtime;
- `HTTP` — network/server-backed runtime;
- `REALTIME` — realtime/event transport;
- `IN_PROCESS` — nuclei co-hosted in one runtime.

A transport is a mechanism, not a second channel. The same message contract, nucleus identity and correlation ID are retained across transport changes.

## Universal APK gateway

N01 is the user-facing hybrid APK/host. A capability may be owned and executed by any nucleus, while the user reaches it through N01. The APK gateway must therefore resolve capability ownership and select an available hybrid transport instead of assuming that every capability is local to N01.

The gateway is a control/access point, not a CPU bottleneck. Independent work may be dispatched in parallel when dependencies permit.

## Live connection proof

A matrix entry is only a logical channel. It is **not** evidence of connectivity.

A directed channel becomes `CONNECTED` only after:

`source -> channel -> negotiated transport -> target endpoint -> validation -> real capability handler -> correlated response/error`

A registry entry without an executable handler is `UNVERIFIED`, not `CONNECTED`.
