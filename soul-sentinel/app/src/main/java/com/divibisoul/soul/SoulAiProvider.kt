package com.divibisoul.soul

/** Browser-session providers; this layer does not require provider API keys. */
enum class SoulAiProvider(val hosts: Set<String>, val loginUrl: String) {
    CHATGPT(setOf("chatgpt.com", "www.chatgpt.com", "auth.openai.com", "openai.com"), "https://chatgpt.com/"),
    GEMINI(setOf("gemini.google.com", "accounts.google.com", "google.com"), "https://gemini.google.com/"),
    CLAUDE(setOf("claude.ai", "www.claude.ai", "auth.anthropic.com", "anthropic.com"), "https://claude.ai/")
}
