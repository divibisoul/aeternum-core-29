package com.divibisoul.soul

/** Explicit capability ownership prevents duplicated tools and keeps server-only work outside the APK. */
data class SoulCapability(val id: String, val owner: String, val execution: Execution)
enum class Execution { LOCAL, WEB_SESSION, REMOTE_SERVICE }

object SoulCapabilityCatalog {
    val capabilities = listOf(
        SoulCapability("mesh.ping", "N01", Execution.LOCAL),
        SoulCapability("files.pick", "N01", Execution.LOCAL),
        SoulCapability("media.pick", "N01", Execution.LOCAL),
        SoulCapability("device.camera", "N01", Execution.LOCAL),
        SoulCapability("device.microphone", "N01", Execution.LOCAL),
        SoulCapability("chat.orchestrate", "N02", Execution.WEB_SESSION),
        SoulCapability("speech.process", "N03", Execution.LOCAL),
        SoulCapability("chat.reason", "N04", Execution.WEB_SESSION),
        SoulCapability("chat.tools", "N05", Execution.WEB_SESSION),
        SoulCapability("ai.generate", "N06", Execution.WEB_SESSION),
        SoulCapability("data.remote", "N01", Execution.REMOTE_SERVICE),
    )

    companion object { const val RECOMMENDED_SESSION_COUNT = 2 }

    fun owner(capability: String): SoulCapability =
        capabilities.firstOrNull { it.id == capability } ?: error("Unknown Soul capability: $capability")
}
