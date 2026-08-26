# SOUL — Capability Master Map

Status: architecture inventory with N01 runtime integration.

## Ownership rule
Each capability has one owning nucleus. Other nuclei consume it through the Soul Mesh/Capability Router instead of copying its implementation.

## N01 confirmed implementation domains

N01 is both an AI nucleus and the native Android/APK host. Its inspected implementation includes:

- AeternumAGI and its cognitive/safety/integrity/resource engines;
- IntentAnalyzer;
- multi-hemispheric cognitive modules;
- PromptCrafter;
- PrecisionEngine;
- CodeVault;
- SelfLoop;
- ProjetoClareira;
- ConscienciaAlgoritmica;
- Chat Engine;
- Supabase-backed chat execution;
- native Android device/context observation;
- Android user-mediated actions;
- WebView hybrid bridge;
- Soul Mesh protocol/router/transports;
- capability registry and ownership catalog.

## N01 Mesh capabilities exposed by the upgrade

| Capability | Owner | Execution | Risk | Status |
|---|---|---|---|---|
| mesh.handshake | N01 | LOCAL | LOW | implemented |
| mesh.health | N01 | LOCAL | LOW | implemented |
| mesh.capabilities | N01 | LOCAL | LOW | implemented |
| cognitive.intent | N01 | LOCAL/Web | LOW | implemented |
| agi.process | N01 | LOCAL/Web | LOW | implemented |
| ai.reasoning | N01 | attached AI session | MEDIUM | adapter implemented; provider/session must be available |
| android.device_info | N01 | LOCAL | LOW | implemented |
| android.battery | N01 | LOCAL | LOW | implemented |
| android.memory | N01 | LOCAL | LOW | implemented |
| android.network | N01 | LOCAL | LOW | implemented |
| android.wifi.state | N01 | LOCAL | LOW | implemented |
| android.bluetooth.state | N01 | LOCAL | LOW | implemented |
| android.brightness.set | N01 | LOCAL | MEDIUM | implemented behind authorization |
| android.wifi.panel | N01 | LOCAL | MEDIUM | implemented behind authorization |
| android.bluetooth.request_enable | N01 | LOCAL | MEDIUM | implemented behind authorization |
| android.airplane.settings | N01 | LOCAL | MEDIUM | implemented behind authorization |
| android.background.stop | N01 | LOCAL | HIGH | implemented behind authorization |

## Remote ownership

Capabilities owned by N02–N06 remain remote contracts until their repositories are independently audited and their handlers are verified. N01 does not invent implementations for them.

## Routing model

```text
User / AI Pilot
      |
      v
N01 AI + Capability Router
      |
      +--> N01 native Android capabilities ----> Android OS
      |
      +--> N01 cognitive/AGI pipeline
      |
      +--> N02..N06 through Soul Mesh
```

## Anti-duplication rule

Before adding a new capability to any nucleus:

1. Search this registry.
2. Identify the existing owner.
3. Reuse the owner's interface through Mesh.
4. Add a new implementation only when no existing owner satisfies the contract.

## Connection proof

Each nucleus is intended to expose five inbound and five outbound peer routes. Logical declarations are not proof of live connectivity.

A directed link becomes `CONNECTED` only after:

`source endpoint -> transport -> target endpoint -> validation -> dispatch -> real handler -> correlated response`

No endpoint placeholder or ping-only response qualifies as E2E proof.

## Important architectural decision

The N01 Android/Web implementation is preserved. Native Android remains the execution layer, the existing web application remains an AI/cognitive runtime, and Mesh is the interoperability layer. Existing tools and functions are consumed through adapters rather than duplicated.
