# Soul Performance Architecture

## Purpose

The Soul APK is a hybrid gateway into a distributed GPU-like fabric. It must not promise to make arbitrary host software faster. Instead, it optimizes work executed through the Soul fabric and exposes the resulting capacity to the host through one interface.

## Performance model

1. Discover runtime capabilities instead of polling every service unnecessarily.
2. Prefer local/in-process execution when the capability is available locally.
3. Prefer low-latency hybrid transports before higher-latency remote transports.
4. Execute independent tasks concurrently.
5. Keep dependency-ordered tasks serialized only where data dependencies require it.
6. Cache capability metadata with an explicit freshness policy.
7. Carry correlation IDs and execution receipts so optimization never hides failures.
8. Never treat an HTTP success response as proof of capability execution.

## Host acceleration boundary

Soul can accelerate tasks that are routed through its fabric: orchestration, parallel capability execution, multimodal processing, document operations, cognitive calls, and other registered work. It cannot safely claim that installing an APK automatically increases the raw CPU/GPU clock, RAM, storage throughput, or performance of unrelated applications. Device-level acceleration requires platform-supported APIs and must be measured on the target hardware.

## Cockpit responsibilities

The Cockpit is the performance control plane. It should expose:

- active runtimes;
- available capabilities;
- channel latency;
- throughput;
- concurrency;
- queue depth;
- failures and retries;
- execution proof;
- AI-session status;
- resource utilization where Android APIs make it available.

The Cockpit should recommend the fastest valid route, not simply the shortest-looking route.
