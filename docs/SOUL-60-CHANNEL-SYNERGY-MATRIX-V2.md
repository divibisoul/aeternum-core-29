# SOUL 60-Channel Synergy Matrix v2

This matrix defines expected functional affinity, not live connectivity. A pair is VERIFIED only after an E2E trace proves transport traversal + target handler execution + correlated response.

## Directed peer pairs
For every unordered pair A/B, there are two directional channels: A.OUT -> B.IN and B.OUT -> A.IN. Across six nuclei this yields 15 bidirectional peer pairs = 30 directed peer relationships; each nucleus also exposes five IN and five OUT logical channels, giving 60 directional channel endpoints.

| Pair | Primary synergy | Expected producer -> consumer |
|---|---|---|
| N01/N02 | user interaction | N01 runtime/user context -> N02 conversation; N02 response -> N01 |
| N01/N03 | device/perception | N01 device/media context -> N03 perception; N03 signals -> N01 |
| N01/N04 | universal tools | N01 user request -> N04 tool/artifact; N04 result -> N01 |
| N01/N05 | control/dispatch | N01 request/context -> N05 orchestration; N05 execution status -> N01 |
| N01/N06 | cognition access | N01 task/context -> N06 cognition; N06 synthesis/audit -> N01 |
| N02/N03 | conversational perception | N02 conversation -> N03 multimodal/context; N03 context -> N02 |
| N02/N04 | tool-assisted conversation | N02 intent -> N04 tools/docs; N04 result -> N02 |
| N02/N05 | conversational orchestration | N02 task -> N05 dispatch; N05 plan/status -> N02 |
| N02/N06 | conversational cognition | N02 context -> N06 reasoning/synthesis; N06 result -> N02 |
| N03/N04 | multimodal artifacts | N03 media/context -> N04 artifact tools; N04 artifacts -> N03 |
| N03/N05 | perception orchestration | N03 signals -> N05 dispatch; N05 requested perception work -> N03 |
| N03/N06 | perception cognition | N03 evidence/context -> N06 cognition; N06 interpretation -> N03 |
| N04/N05 | tool orchestration | N04 capability state/results -> N05; N05 dispatch -> N04 |
| N04/N06 | artifacts cognition | N04 documents/artifacts -> N06; N06 analysis -> N04 |
| N05/N06 | orchestration cognition | N05 plan/context -> N06; N06 reasoning/governance -> N05 |

## Verification states
UNVERIFIED = topology/contract exists only.
NEGOTIATING = transport selection attempted.
CONNECTED = request traversed transport and target accepted it.
EXECUTED = target handler actually ran.
VERIFIED = correlated response returned and the expected capability effect was observed.
FAILED = an observed failure; never coerce to success.

## System synergy
System-level synergy is the set of VERIFIED directed flows and their composition. It must not be represented by a single optimistic percentage. Reports must distinguish static compatibility from runtime proof.
