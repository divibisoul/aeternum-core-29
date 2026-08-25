package com.divibisoul.soul

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.PowerManager
import java.time.LocalTime

class SoulCortex(private val context: Context, private val config: SoulConfig) {
    data class Decision(val action: String, val reason: String)

    fun evaluate(): List<Decision> {
        val battery = context.getSystemService(android.os.BatteryManager::class.java)
            .getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)
        val screenOn = context.getSystemService(PowerManager::class.java).isInteractive
        val decisions = mutableListOf<Decision>()

        if (config.lowBatteryRule && battery < config.batteryThreshold && !screenOn) {
            decisions += Decision(
                "LOW_BATTERY_CONTEXT",
                "Battery $battery% and screen off; enter conservation policy"
            )
        }

        val fg = foregroundPackage()
        if (config.videoWifiRule && fg in VIDEO_PACKAGES) {
            decisions += Decision(
                "VIDEO_CONTEXT",
                "Foreground video app detected: $fg"
            )
        }

        val hour = LocalTime.now().hour
        if (config.nightRule && (hour >= 23 || hour < 6) && !screenOn) {
            decisions += Decision(
                "NIGHT_CONTEXT",
                "Night window with screen off"
            )
        }

        return decisions
    }

    fun foregroundPackage(): String? {
        return try {
            val usm = context.getSystemService(UsageStatsManager::class.java)
                ?: return null

            val end = System.currentTimeMillis()
            val begin = end - 10_000L

            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                begin,
                end
            ) ?: return null

            stats.maxByOrNull { it.lastTimeUsed }?.packageName
        } catch (_: SecurityException) {
            null
        } catch (_: Throwable) {
            null
        }
    }

    companion object {
        private val VIDEO_PACKAGES = setOf(
            "com.google.android.youtube",
            "com.netflix.mediaclient",
            "com.amazon.avod.thirdpartyclient"
        )
    }
}
