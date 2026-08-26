package com.divibisoul.soul

/**
 * Canonical ownership catalog. A capability is executable only by its owner;
 * other nuclei consume it through Mesh rather than duplicating the implementation.
 */
data class SoulCapability(val id: String, val owner: String, val execution: Execution, val risk: Risk = Risk.LOW)
enum class Execution { LOCAL, WEB_SESSION, REMOTE_SERVICE }
enum class Risk { LOW, MEDIUM, HIGH }

object SoulCapabilityCatalog {
    val capabilities = listOf(
        SoulCapability("mesh.handshake", "N01", Execution.LOCAL),
        SoulCapability("mesh.health", "N01", Execution.LOCAL),
        SoulCapability("mesh.capabilities", "N01", Execution.LOCAL),
        SoulCapability("android.device_info", "N01", Execution.LOCAL),
        SoulCapability("android.battery", "N01", Execution.LOCAL),
        SoulCapability("android.memory", "N01", Execution.LOCAL),
        SoulCapability("android.network", "N01", Execution.LOCAL),
        SoulCapability("android.wifi.state", "N01", Execution.LOCAL),
        SoulCapability("android.bluetooth.state", "N01", Execution.LOCAL),
        SoulCapability("android.brightness.set", "N01", Execution.LOCAL, Risk.MEDIUM),
        SoulCapability("android.wifi.panel", "N01", Execution.LOCAL, Risk.MEDIUM),
        SoulCapability("android.bluetooth.request_enable", "N01", Execution.LOCAL, Risk.MEDIUM),
        SoulCapability("android.airplane.settings", "N01", Execution.LOCAL, Risk.MEDIUM),
        SoulCapability("android.background.stop", "N01", Execution.LOCAL, Risk.HIGH),
        SoulCapability("ai.request_suggestions", "N01", Execution.REMOTE_SERVICE),
        SoulCapability("chat.orchestrate", "N02", Execution.WEB_SESSION),
        SoulCapability("speech.process", "N03", Execution.LOCAL),
        SoulCapability("chat.reason", "N04", Execution.WEB_SESSION),
        SoulCapability("chat.tools", "N05", Execution.WEB_SESSION),
        SoulCapability("ai.generate", "N06", Execution.WEB_SESSION),
        SoulCapability("data.remote", "N01", Execution.REMOTE_SERVICE),
    )

    fun owner(capability: String): SoulCapability =
        capabilities.firstOrNull { it.id == capability } ?: error("Unknown Soul capability: $capability")

    fun ownedBy(nucleus: String): List<SoulCapability> = capabilities.filter { it.owner == nucleus }
}
