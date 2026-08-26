# SOUL N01↔N06 Compatibility Fabric

Status: additive design contract; do not mark a connection CONNECTED from discovery, health, or ping alone.

## Purpose
N01 and N06 remain independent AI nuclei. They exchange capabilities, tools, context and execution results through a common logical protocol. Implementations remain owned by their source nucleus.

## N01 reference transports
The logical channel MUST be transport-neutral and may negotiate IN_PROCESS, WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP or REALTIME. Transport is not part of capability identity.

## Capability exchange
A peer MUST be able to discover, for each capability:
- stable capability id;
- owner nucleus;
- version;
- input/output schema;
- AI/provider dependency;
- required context class;
- tool dependencies;
- supported transports;
- authorization requirements;
- timeout/retry policy.

## Tool exchange
Tool discovery MUST expose metadata only unless execution is authorized. Remote execution MUST preserve the owning nucleus as the execution authority. User-session credentials MUST NOT be forwarded implicitly between nuclei.

## Context exchange
Context is explicit and typed. A request declares the minimum context required. N01 may provide device/runtime context; N06 may provide cognitive/conversation/context artifacts. Sensitive session state is never implicitly exported.

## Execution contract
The meaningful proof of an AI-to-AI connection is:
1. capability discovery;
2. authorized capability request;
3. transport delivery;
4. destination runtime resolution;
5. real handler execution;
6. structured correlated response;
7. observable result at the requesting nucleus.

Ping/health may diagnose the transport but never proves capability connectivity.

## N01→N06 reference flows
- `ai.reasoning`: N01 supplies permitted context; N06 executes its AI runtime; N01 receives structured result.
- `conversation`: N01 delegates conversational processing to N06 when authorized.
- `tools.describe`: N01 discovers N06 tools without receiving private credentials.
- `context.orchestration`: N01 delegates context synthesis to N06 when authorized.

## N06→N01 reference flows
- `android.device_info`: N06 requests device information; N01 executes through its Android runtime.
- `android.battery`: N06 requests battery state through N01 ownership.
- `android.memory`: N06 requests memory state through N01 ownership.
- `android.network`: N06 requests network state through N01 ownership.
- `android.events`: N06 requests authorized runtime events through N01 ownership.

## Compatibility rule
The N01 contract is the reference for identity and transport semantics, but N01 does not own N06 capabilities. The shared fabric adapts protocol differences without copying business logic.

## Connection state
- DISCOVERABLE: metadata exchange works.
- NEGOTIATED: protocol/transport/capability schemas agree.
- EXECUTABLE: authorized real handler can be invoked.
- VERIFIED: a real capability transaction completed in both directions.
- FUSED: a multi-step transaction composes N01 and N06 capabilities/context in one observable workflow.

Only VERIFIED/FUSED count as functional AI-to-AI connectivity.