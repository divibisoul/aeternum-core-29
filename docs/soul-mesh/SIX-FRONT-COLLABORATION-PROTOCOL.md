# SOUL — Six-Front Collaboration Protocol

## Purpose

This document defines the GitHub-mediated coordination contract for the six simultaneous SOUL engineering fronts. A front is an independent ChatGPT conversation working on one nucleus. GitHub is the shared source of truth and the inter-front message bus.

## Rules

1. Never assume another front is idle.
2. Before modifying a nucleus, read its latest branch state and recent commits.
3. Never delete existing functionality merely because another implementation looks cleaner.
4. Prefer canonicalization, adapters, compatibility layers, and integration.
5. Every completed task writes a durable handoff record into GitHub.
6. A handoff must state: nucleus, pair, task, completed work, files changed, capabilities/tools affected, dependencies, next recommended task, and commit SHA.
7. The receiving front must re-read the repository before acting; the handoff is advisory, not proof of correctness.
8. When two fronts work on a pair, they must use the same protocol version and capability ownership model.
9. A capability belongs to its owning nucleus; another nucleus may request it, compose it, enrich it, or orchestrate it, but must not silently duplicate its implementation.
10. A successful connection means AI/agent/tool composition, not merely transport reachability.

## Pair model

For each pair A↔B, both directions must support:

- capability discovery;
- request/response correlation;
- remote capability invocation;
- local agent/tool execution;
- enriched result return;
- failure propagation;
- fallback/timeout semantics;
- provenance identifying the executing nucleus, agent and tool.

## Multiplicative composition

A pair is considered composition-ready only when:

`A capability + B capability + A agent + B agent + A tools + B tools`

can participate in an explicit workflow where each side contributes something the other side does not own.

The goal is not 1+1 endpoint connectivity. The target is cooperative composition:

`A -> request B -> B agent/tool -> B result -> A agent/tool -> enriched result`

and the reverse direction.

## Handoff format

Use `docs/soul-mesh/handoffs/PAIR-<A>-<B>.md` and update it after each material change. Never overwrite another front's work without first incorporating its latest state.

## Source of truth

Conversation memory is not authoritative. GitHub repository content, commit history, branches and explicit handoff records are authoritative.
