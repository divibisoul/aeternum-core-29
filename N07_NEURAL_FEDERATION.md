# N01 → N07 Neural Federation

N01 exposes its neural workloads through `src/soul-neural/N07NeuralBridge.ts`. The bridge sends `neural.forward@1.0.0` and `neural.learn@1.0.0` to N07 through Soul Mesh contract `1.1.0`, with HMAC-SHA256, correlation, nonce, timeout and finite-value validation.

N01 remains owner of native Android execution. N07 remains owner of shared neural orchestration. This is additive and must be preserved when concurrent fronts merge.
