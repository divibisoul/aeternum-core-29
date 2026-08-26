package com.divibisoul.soul

/** Browser-session providers; this layer does not require provider API keys. */
enum class SoulAiProvider(val host: String, val loginUrl: String) {
    CHATGPT("chatgpt.com", "https://chatgpt.com/"),
    GEMINI("gemini.google.com", "https://gemini.google.com/"),
    CLAUDE("claude.ai", "https://claude.ai/")
}
