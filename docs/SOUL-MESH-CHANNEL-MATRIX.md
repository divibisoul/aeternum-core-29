# Soul Mesh — Complete Channel Matrix

The six nuclei now have an explicit complete logical channel matrix.

Each nucleus has exactly 5 outbound peers and 5 inbound peers:

| Nucleus | OUT | IN |
|---|---|---|
| N01 | N02,N03,N04,N05,N06 | N02,N03,N04,N05,N06 |
| N02 | N01,N03,N04,N05,N06 | N01,N03,N04,N05,N06 |
| N03 | N01,N02,N04,N05,N06 | N01,N02,N04,N05,N06 |
| N04 | N01,N02,N03,N05,N06 | N01,N02,N03,N05,N06 |
| N05 | N01,N02,N03,N04,N06 | N01,N02,N03,N04,N06 |
| N06 | N01,N02,N03,N04,N05 | N01,N02,N03,N04,N05 |

Totals:

- 30 logical OUT links;
- 30 logical IN links;
- 15 bidirectional peer pairs.

A logical channel is not automatically a live connection. Each channel must bind to a runtime endpoint and pass the connection proof sequence.

## Required live proof

For every directed link:

`source endpoint -> transport -> target endpoint -> validation -> dispatch -> ACK/response -> correlation`

Only then is that directed link `CONNECTED`.

The matrix is deliberately generated from the six canonical nucleus IDs rather than manually duplicating 60 declarations, preventing mismatched or missing peers.
