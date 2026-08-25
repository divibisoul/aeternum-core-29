# Soul Unified System

This directory is the integration boundary for the six historical repositories that together form Soul.

## Runtime model

`Soul Sentinel` is the Android executable. It owns device permissions, native perception, Guardian policy and safe execution.

`Aeternum Core` owns orchestration, events, capabilities, diagnostics and higher-level state.

`Eternium`, `Nexus Aeternum Fusion` and the `AI Chatbot` family are capability providers. They are not separate Android apps.

The three AI Chatbot repositories are retained as historical variants until their differences are audited; only the canonical `nextjs-ai-chatbot` is currently designated as the primary conversation provider.

## Connection contract

```text
Android / Soul Sentinel
        |
        | typed events + capability state
        v
Aeternum Core
        |
        +--> AI Gateway --> Eternium/Gemini
        |
        +--> Conversation --> AI Chatbot
        |
        +--> UI/Services --> Nexus Fusion
        |
        +--> Guardian --> Android execution
```

No AI provider can bypass Guardian to execute privileged Android operations.

## Build target

The immediate artifact is a debug APK from `soul-sentinel`. The web/AI repositories become service/capability sources and are integrated incrementally behind stable contracts rather than copied blindly into the Android application.
