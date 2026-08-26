package com.divibisoul.soul.core

import android.content.Context
import com.divibisoul.soul.SoulAiTools
import rikka.shizuku.Shizuku

enum class CapabilityAvailability { AVAILABLE, UNAVAILABLE, NOT_AUTHORIZED, UNKNOWN }
enum class CapabilityRisk { LOW, MEDIUM, HIGH }

data class Capability(
    val id: String,
    val provider: String,
    val availability: CapabilityAvailability,
    val risk: CapabilityRisk,
    val version: String = "1"
)

class SoulCapabilityRegistry(private val context: Context) {
    fun scan(): List<Capability> = listOf(
        Capability("android.device_info", "Android", CapabilityAvailability.AVAILABLE, CapabilityRisk.LOW, android.os.Build.VERSION.SDK_INT.toString()),
        Capability("android.battery", "Android", CapabilityAvailability.AVAILABLE, CapabilityRisk.LOW),
        Capability("android.memory", "Android", CapabilityAvailability.AVAILABLE, CapabilityRisk.LOW),
        Capability("android.network", "Android", CapabilityAvailability.AVAILABLE, CapabilityRisk.LOW),
        Capability("android.events", "Android", CapabilityAvailability.AVAILABLE, CapabilityRisk.LOW),
        Capability(
            SoulAiTools.REQUEST_SUGGESTIONS,
            "Nucleus05",
            CapabilityAvailability.AVAILABLE,
            CapabilityRisk.MEDIUM,
            "1"
        ),
        shizukuCapability()
    )

    private fun shizukuCapability(): Capability = try {
        when {
            !Shizuku.pingBinder() -> Capability("shizuku.bridge", "Shizuku", CapabilityAvailability.UNAVAILABLE, CapabilityRisk.HIGH)
            Shizuku.checkSelfPermission() == android.content.pm.PackageManager.PERMISSION_GRANTED -> Capability("shizuku.bridge", "Shizuku", CapabilityAvailability.AVAILABLE, CapabilityRisk.HIGH)
            else -> Capability("shizuku.bridge", "Shizuku", CapabilityAvailability.NOT_AUTHORIZED, CapabilityRisk.HIGH)
        }
    } catch (_: Throwable) {
        Capability("shizuku.bridge", "Shizuku", CapabilityAvailability.UNKNOWN, CapabilityRisk.HIGH)
    }
}
