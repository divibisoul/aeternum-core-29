package com.divibisoul.soul

/** Browser-session providers. Soul does not require provider API keys for this mode. */
enum class SoulAiProvider(
    val displayName: String,
    val role: String,
    val hosts: Set<String>,
    val loginUrl: String,
) {
    CHATGPT(
        "ChatGPT",
        "Primary reasoning / general execution",
        setOf("chatgpt.com", "www.chatgpt.com", "auth.openai.com", "openai.com"),
        "https://chatgpt.com/",
    ),
    GEMINI(
        "Gemini",
        "Independent analysis / multimodal specialist",
        setOf("gemini.google.com", "accounts.google.com", "google.com"),
        "https://gemini.google.com/",
    ),
    CLAUDE(
        "Claude",
        "Independent critic / synthesis specialist",
        setOf("claude.ai", "www.claude.ai", "auth.anthropic.com", "anthropic.com"),
        "https://claude.ai/",
    );

    companion object {
        /** Three is the initial operating set: executor + independent analyst + critic. */
        const val RECOMMENDED_SESSION_COUNT = 3
    }
}
