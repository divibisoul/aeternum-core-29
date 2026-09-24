# Soul Mesh — Complete Channel Matrix

The seven nuclei now have an explicit complete logical channel matrix.

Each nucleus has exactly 6 outbound peers and 6 inbound peers:

| Nucleus | OUT | IN |
|---|---|---|
| N01 | N02,N03,N04,N05,N06,N07 | N02,N03,N04,N05,N06,N07 |
| N02 | N01,N03,N04,N05,N06,N07 | N01,N03,N04,N05,N06,N07 |
| N03 | N01,N02,N04,N05,N06,N07 | N01,N02,N04,N05,N06,N07 |
| N04 | N01,N02,N03,N05,N06,N07 | N01,N02,N03,N05,N06,N07 |
| N05 | N01,N02,N03,N04,N06,N07 | N01,N02,N03,N04,N06,N07 |
| N06 | N01,N02,N03,N04,N05,N07 | N01,N02,N03,N04,N05,N07 |

Totals:

- 42 logical OUT links;
- 42 logical IN links;
- 21 bidirectional peer pairs;
- 84 IN/OUT channel endpoints.

A logical channel is not automatically a live connection. Each channel must bind to a runtime endpoint and pass the connection proof sequence.

## Required live proof

For every directed link:

`source endpoint -> transport -> target endpoint -> validation -> dispatch -> ACK/response -> correlation`

Only then is that directed link `CONNECTED`.

The matrix is deliberately generated from the seven canonical nucleus IDs rather than manually duplicating 60 declarations, preventing mismatched or missing peers.
