# Soul Mesh — Multi-IA Operating Directive

## Purpose

N01–N06 are six independent AI nuclei. Each nucleus owns its identity, agents, capabilities, runtime, tools, memory/context and execution logic. Soul Mesh is the interoperability layer that lets the six independent AIs discover one another, request work, respond, delegate work and correlate distributed tasks.

This directive is additive to the existing Soul Mesh contracts. It does not replace or cancel existing protocols, transports, routes, tests or security controls.

## Required behavior per nucleus

Every N01–N06 must provide, directly or through its existing adapters/runtime:

1. **Mesh ingress** — receive and validate a Mesh message addressed to the nucleus.
2. **Identity** — expose an unambiguous nucleus identity (N01…N06) and runtime identity.
3. **Agents/capabilities** — advertise executable capabilities and the agent/runtime responsible for each capability.
4. **Mesh egress** — send work to another nucleus through the existing Soul Mesh transport abstraction; do not create a parallel API solely for inter-IA communication.
5. **Response** — return success, failure or partial result to the requesting nucleus.
6. **Discovery** — discover available nuclei/capabilities through the existing Mesh discovery mechanism.
7. **Delegation** — delegate a task when the local nucleus cannot or should not execute it, preserving the original requester and task context.
8. **Correlation** — preserve correlation/request/conversation context across every hop.

## Functional model

```text
                 SOUL MESH
                     |
       +-------------+-------------+
       |             |             |
      N01           N02           N03
       IA            IA            IA
    agents        agents        agents
       |             |             |
       +-------------+-------------+
                     |
              +------+------+------+
              |      |      |
             N04    N05    N06
              IA     IA     IA
           agents  agents  agents
```

A valid distributed task may therefore follow:

```text
N01 -> N02 -> N03 -> N04 -> N06 -> N01
```

Each hop remains an operation of the receiving AI. No nucleus impersonates another nucleus and no gateway silently executes another nucleus's capability.

## Route semantics

Mesh routes must represent real protocol operations, not placeholder `status: ok` responses. A route is considered operational only when the complete lifecycle is executable:

```text
discovery
  -> identity/handshake
  -> authorization
  -> request
  -> capability resolution
  -> local agent/runtime execution
  -> response
  -> correlation/trace propagation
```

Health endpoints may remain lightweight health checks, but they must not be used as proof of IA-to-IA execution.

## Delegation semantics

When N-A delegates to N-B:

- `source` remains the initiating nucleus where protocol semantics require original-source attribution;
- the immediate sender/receiver relationship must remain observable;
- `target` identifies the nucleus responsible for the current hop;
- `capability` identifies the requested executable capability;
- `correlationId` remains stable for the logical task;
- a hop/task identifier may be added without replacing the existing correlation identifier;
- the receiving nucleus authorizes and executes locally;
- the result returns through Mesh and remains attributable to the original task.

## Observability

Use the existing Soul Mesh correlation model and align distributed telemetry with OpenTelemetry messaging/context-propagation concepts. Producer and consumer execution must remain correlatable across process, network and transport boundaries. Do not expose sensitive prompts, credentials or secret payloads in telemetry.

## Implementation rule

When auditing or upgrading a nucleus, the first question is not "does a route exist?" but:

> Can this independent AI receive a real request, resolve one of its own agents/capabilities, execute it, return the result, and participate in the same lifecycle when another nucleus delegates work to it?

If the answer is no, correct the missing implementation immediately using the existing architecture and transport abstractions before proceeding.

## Compatibility rule

Existing N01–N06 Mesh contracts, transports, capability runtimes, security controls, CI, tests and documentation remain valid unless a concrete defect requires a minimal corrective change. This directive is cumulative and is intended to guide all subsequent implementation and validation.
