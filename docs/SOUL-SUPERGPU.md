# SOUL SuperGPU

## Definition

SuperGPU is the SOUL's federated software-compute fabric. It does not claim to physically merge six independent runtimes into one hardware GPU. It schedules and composes work across the six nuclei, choosing local execution, WebAssembly, browser/device WebGPU when available, or remote Mesh execution.

## What it can realistically do

- Execute independent capability tasks in parallel.
- Represent dependency graphs and execute ready waves concurrently.
- Prefer the native owner of a capability.
- Route work to another nucleus through Soul Mesh without copying its provider or tools.
- Choose an available compute backend according to runtime support.
- Fall back from unavailable accelerators to another valid backend or remote nucleus.
- Keep each nucleus independently deployable and operational when peers are unavailable.
- Compose several native capabilities into a higher-level workflow.
- Preserve correlation, provenance and ownership across distributed execution.

## What it cannot honestly claim

- It cannot turn six networked applications into a single physical GPU.
- It cannot pool unrelated RAM or VRAM into one transparent hardware memory space without specialized distributed-memory infrastructure.
- It cannot make an AI model faster merely by having more nuclei; parallelism helps only when work can be decomposed and the communication cost is acceptable.
- It cannot execute every model through WebGPU. Backend support is model, browser and device dependent.
- It cannot prove runtime interoperability when the participating services are not simultaneously deployed and reachable.

## Execution model

```text
Task graph
  -> capability resolution
  -> native owner selection
  -> dependency scheduling
  -> backend selection
  -> parallel execution
  -> correlated result collection
  -> context/result fusion
  -> optional validation/retry
```

## Backends

- `IN_PROCESS`: fastest path for work already inside a nucleus.
- `WEBASSEMBLY`: portable CPU-side execution for suitable workloads.
- `WEBGPU`: hardware-accelerated browser/device computation when supported.
- `REMOTE_MESH`: distributed execution by the nucleus that owns the capability.

The WebGPU backend is an optional acceleration path, not a requirement for the SOUL Mesh. Modern browser stacks expose WebGPU for general GPU compute, and ONNX Runtime can use WebGPU for supported inference graphs. Backend availability must be detected at runtime.

## SuperGPU versus SOUL Mesh

SOUL Mesh is the nervous system: identity, protocol, discovery, security, routing and correlated communication.

SuperGPU is the compute fabric above it: selecting work, parallelizing independent tasks, respecting dependencies, selecting execution backends and combining results.

The two layers are complementary and must remain separate.

## Individuality invariant

Every nucleus retains its native runtime, agents, tools, capabilities, provider integration and independent deployment. SuperGPU adds scheduling and composition; it does not replace those implementations.
