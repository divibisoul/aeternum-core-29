package com.divibisoul.soul

/** Explicit capability ownership prevents duplicated tools and keeps server-only work outside the APK. */
data class SoulCapability(val id: String, val owner: String, val execution: Execution)
enum class Execution { LOCAL, WEB_SESSION, REMOTE_SERVICE }

object SoulCapabilityCatalog {
    val capabilities = listOf(
        SoulCapability("mesh.ping", "N01", Execution.LOCAL),
        SoulCapability("chat.orchestrate", "N02", Execution.WEB_SESSION),
        SoulCapability("speech.process", "N03", Execution.LOCAL),
        SoulCapability("chat.reason", "N04", Execution.WEB_SESSION),
        SoulCapability("chat.tools", "N05", Execution.WEB_SESSION),
        SoulCapability("ai.generate", "N06", Execution.WEB_SESSION),
        SoulCapability("data.remote", "N01", Execution.REMOTE_SERVICE),
        SoulCapability("clareira.android.snapshot", "N01", Execution.LOCAL),
        SoulCapability("clareira.android.brightness", "N01", Execution.LOCAL),
        SoulCapability("clareira.android.kill_background", "N01", Execution.LOCAL),
        SoulCapability("clareira.android.wifi_panel", "N01", Execution.LOCAL),
        SoulCapability("clareira.android.bluetooth_request", "N01", Execution.LOCAL),
        SoulCapability("clareira.android.airplane_settings", "N01", Execution.LOCAL),
    )

    fun owner(capability: String): SoulCapability =
        capabilities.firstOrNull { it.id == capability } ?: error("Unknown Soul capability: $capability")
}
