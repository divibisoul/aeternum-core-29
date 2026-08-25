# SOUL — Specification v1.3

## Status

Milestone 001 — Soul Sentinel v0.1

This document is the current engineering source of truth for the Soul project. It is intentionally independent of any single AI provider, Android privilege mechanism, or UI framework.

## Mission

Soul is an adaptive cognitive layer for Android designed to translate natural human intent into safe, contextual, reversible computer actions while preserving user autonomy.

## Core principles

1. Amplification — increase the user's capabilities without replacing their autonomy.
2. Transparency — important actions must be explainable.
3. Reversibility — reversible operations should remain reversible.
4. Controlled evolution — learning must distinguish facts, hypotheses, and rejected information.
5. Modularity — no AI provider or execution bridge is mandatory.
6. Graceful degradation — loss of network, Shizuku, Termux, or a model must not destroy the core.
7. Privacy by architecture — sensitive information is not sent remotely unless authorized and necessary.
8. Human in the loop — consequential decisions remain under user control.
9. Model independence — OpenAI, Gemini, DeepSeek, local models, and future providers are connectors, not the Soul itself.
10. Operational self-knowledge — Soul must know its capabilities, permissions, state, and limitations.

## v0.1 scope

The first real build is Soul Sentinel. It does not attempt autonomous optimization, aggressive RAM management, deep device modification, or continuous autonomous learning.

It must:

- start reliably;
- expose Soul Core state;
- provide an internal event bus;
- discover and register capabilities;
- report Android/device information;
- detect Shizuku availability when the integration is present;
- expose basic diagnostics;
- maintain structured logs;
- keep privileged execution behind a Guardian boundary.

## Architecture

```text
Soul Sentinel
├── Soul Core
├── Event Bus
├── Capability Registry
├── Diagnostics
├── Guardian
└── Android Bridge
```

Future layers:

```text
Voice Core
Context Engine
Memory Core
Evolution Core
AI Gateway
Cortex
Agents
Predictive Engine
```

## Event Bus

All modules communicate through typed events rather than direct coupling whenever practical.

Initial event vocabulary:

- SOUL_STARTED
- DEVICE_DETECTED
- CAPABILITIES_SCANNED
- SHIZUKU_STATUS_CHANGED
- PERMISSION_STATUS_CHANGED
- MODULE_STARTED
- MODULE_STOPPED
- DIAGNOSTIC_WARNING
- DIAGNOSTIC_ERROR

Events must include timestamp, source, type, and structured payload.

## Capability Registry

Each capability has:

- stable identifier;
- provider;
- availability;
- permission state;
- risk level;
- version/implementation metadata;
- optional human-readable description.

Examples:

- android.device_info
- android.notifications
- shizuku.bridge
- terminal.execution
- voice.input
- ai.reasoning

The registry describes actual observed capabilities; it must not assume capabilities merely because a module exists.

## Guardian

No remote model or autonomous agent may directly execute privileged Android operations.

Requests flow through:

```text
AI / Agent → Tool Request → Guardian → Policy → Authorization → Executor
```

Risk classes:

- LOW — safe/reversible operations that may be automated by policy.
- MEDIUM — operations requiring confirmation depending on user policy.
- HIGH — privileged, destructive, privacy-sensitive, or difficult-to-reverse operations requiring explicit authorization.

## AI Gateway

The Cortex communicates with providers through a provider-neutral gateway. The gateway will eventually support official authentication/authorization flows where available. Passwords must never be stored by Soul.

Provider connectors may include OpenAI, Gemini, DeepSeek, and local models.

The gateway is responsible for provider selection, capability negotiation, request normalization, response normalization, and connection health. It does not grant device privileges.

## Voice Core

Voice is a primary human interface, not merely an add-on. Planned modes:

- push-to-talk;
- command mode;
- continuous conversation;
- task/assistant mode.

Natural interruption (barge-in) is a required future capability.

## Context and memory

Memory must favor durable, useful knowledge over raw conversation history. Context may include project terminology, user-approved preferences, active tasks, and validated project knowledge.

## Evolution Core

Continuous learning is implemented initially as controlled memory/context evolution, not automatic modification of an external model's weights.

Pipeline:

```text
Experience → Candidate Knowledge → Validation → Confidence → Memory/Evolution Ledger
```

Knowledge states:

- CONFIRMED
- HYPOTHESIS
- REJECTED

Every persistent knowledge change should be attributable and reversible.

## Self Model

Soul maintains an operational self-model containing:

- current version;
- active modules;
- available capabilities;
- permission state;
- provider connections;
- important limitations;
- health/diagnostic state.

## First acceptance test

A successful v0.1 installation must display a trustworthy status showing:

- Soul Core: ONLINE
- Event Bus: ONLINE
- Capability Engine: ONLINE
- Diagnostics: ONLINE
- Android/device information detected
- Shizuku status accurately detected or explicitly unavailable
- event stream containing startup and discovery events

## Non-goals for v0.1

- root access;
- autonomous destructive actions;
- automatic system cleanup;
- unrestricted privileged execution;
- model training;
- pretending that memory equals consciousness;
- provider-specific lock-in.

## Engineering rule

Every new idea is treated as a proposal. It becomes part of the architecture only after it has a clear purpose, interface, security impact, and testable acceptance criterion.
