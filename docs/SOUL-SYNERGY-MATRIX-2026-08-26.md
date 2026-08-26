# Soul Synergy Matrix — 2026-08-26

This matrix describes the useful composition of the 15 bidirectional nucleus pairs. It does not claim runtime connectivity.

| Pair | Forward synergy | Reverse synergy |
|---|---|---|
| N01↔N02 | gateway supplies user context; conversation supplies response | conversation requests user/session services |
| N01↔N03 | gateway supplies user input; perception supplies multimodal/context signals | perception requests device/session/media access |
| N01↔N04 | gateway exposes tools/artifacts to user; tool results return to UI | tools request host capabilities when authorized |
| N01↔N05 | gateway submits work; orchestration dispatches parallel jobs | orchestration requests gateway session/cockpit state |
| N01↔N06 | gateway supplies directives/context; cognition supplies synthesis/governance | cognition requests user/session/host context |
| N02↔N03 | dialogue enriched by multimodal/context analysis | perception receives conversational intent |
| N02↔N04 | conversation invokes tools/documents and receives artifacts | tools receive natural-language intent and return results |
| N02↔N05 | conversation creates executable work; Pilot dispatches it | Pilot receives dialogue state and returns orchestration status |
| N02↔N06 | dialogue is enriched by reasoning/synthesis | cognition receives questions and conversational context |
| N03↔N04 | perception produces structured inputs for tools/artifacts | tools request media/context transformations |
| N03↔N05 | perception signals become parallel work items | orchestration schedules perception work |
| N03↔N06 | perception feeds multimodal evidence into cognition | cognition requests additional perceptual analysis |
| N04↔N05 | tools expose executable capabilities; Pilot selects and sequences them | Pilot sends tool jobs and receives artifacts/results |
| N04↔N06 | artifacts/data become evidence for cognition | cognition requests analysis/transformation of artifacts |
| N05↔N06 | orchestration sends reasoning/planning work to cognition | cognition supplies plans, constraints and synthesis to dispatch |

## System-level synergy

The useful composition is not a serial chain. The Pilot may dispatch independent capabilities in parallel, collect correlated results, then ask N06 for synthesis while N03/N04 continue producing evidence or artifacts when dependencies allow. N01 remains the universal user gateway and Cockpit, but it must not become a single-thread execution bottleneck.

## Missing-to-functional question

At every reconstruction step ask: **What, in concrete runtime terms, is still missing for the hybrid system to be fully connected and for every existing function/tool/area to work through the APK?** The answer must produce the next repair. A connection is not considered complete until transport, endpoint, handler, capability, authorization, correlation and useful result composition are all demonstrated.
