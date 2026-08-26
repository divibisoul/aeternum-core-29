package com.divibisoul.soul

/** Browser-session providers. Soul does not require provider API keys for this mode. */
enum class SoulAiProvider(
    val displayName: String,
    val role: String,
    val hosts: Set<String>,
    val loginUrl: String,
) {
    CHATGPT(
        "IA 1",
        "User-selected primary reasoning session",
        setOf("chatgpt.com", "www.chatgpt.com", "auth.openai.com", "openai.com"),
        "https://chatgpt.com/",
    ),
    CLAUDE(
        "IA 2",
        "User-selected independent analysis session",
        setOf("claude.ai", "www.claude.ai", "auth.anthropic.com", "anthropic.com"),
        "https://claude.ai/",
    );

    companion object {
        /** Initial operating set. Additional providers can be added without changing the Soul Mesh contract. */
        const val RECOMMENDED_SESSION_COUNT = 2
    }
}
