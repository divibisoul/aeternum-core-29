package com.divibisoul.soul

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.BatteryManager
import android.os.PowerManager
import java.time.LocalTime

class SoulCortex(private val context: Context, private val config: SoulConfig) {
    data class Decision(val action: String, val reason: String)
    data class IntegritySnapshot(
        val coreHealthy: Boolean,
        val meshHealthy: Boolean,
        val batteryPercent: Int,
        val screenInteractive: Boolean,
        val wifiEnabled: Boolean,
        val bluetoothEnabled: Boolean,
        val nuclei: Int,
        val directedLinks: Int,
        val bidirectionalPairs: Int,
        val timestamp: Long,
    )

    fun evaluate(): List<Decision> {
        val battery = batteryPercent()
        val screenOn = context.getSystemService(PowerManager::class.java)?.isInteractive == true
        val decisions = mutableListOf<Decision>()

        if (config.lowBatteryRule && battery in 0 until config.batteryThreshold && !screenOn) {
            decisions += Decision("LOW_BATTERY_CONTEXT", "Battery $battery% and screen off; enter conservation policy")
        }
        val fg = foregroundPackage()
        if (config.videoWifiRule && fg in VIDEO_PACKAGES) decisions += Decision("VIDEO_CONTEXT", "Foreground video app detected: $fg")
        val hour = LocalTime.now().hour
        if (config.nightRule && (hour >= 23 || hour < 6) && !screenOn) decisions += Decision("NIGHT_CONTEXT", "Night window with screen off")
        return decisions
    }

    fun integritySnapshot(now: Long = System.currentTimeMillis()): IntegritySnapshot {
        val channelsHealthy = runCatching {
            SoulMeshChannels.nuclei.size == 7 &&
                SoulMeshChannels.nuclei.all { SoulMeshChannels.out(it).size == 6 && SoulMeshChannels.input(it).size == 6 } &&
                SoulMeshChannels.directedLinks().size == 42 &&
                SoulMeshChannels.bidirectionalPairs().size == 21
        }.getOrDefault(false)
        val intervalHealthy = config.checkIntervalMs in 10_000L..300_000L
        return IntegritySnapshot(
            coreHealthy = intervalHealthy,
            meshHealthy = channelsHealthy,
            batteryPercent = batteryPercent(),
            screenInteractive = context.getSystemService(PowerManager::class.java)?.isInteractive == true,
            wifiEnabled = runCatching { context.getSystemService(android.net.wifi.WifiManager::class.java)?.isWifiEnabled == true }.getOrDefault(false),
            bluetoothEnabled = runCatching { context.getSystemService(android.bluetooth.BluetoothManager::class.java)?.adapter?.isEnabled == true }.getOrDefault(false),
            nuclei = SoulMeshChannels.nuclei.size,
            directedLinks = SoulMeshChannels.directedLinks().size,
            bidirectionalPairs = SoulMeshChannels.bidirectionalPairs().size,
            timestamp = now,
        )
    }

    private fun batteryPercent(): Int = runCatching {
        context.getSystemService(BatteryManager::class.java)?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
    }.getOrDefault(-1)

    fun foregroundPackage(): String? = try {
        val usm = context.getSystemService(UsageStatsManager::class.java) ?: return null
        val end = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, end - 10_000L, end) ?: return null
        stats.maxByOrNull { it.lastTimeUsed }?.packageName
    } catch (_: SecurityException) {
        null
    } catch (_: Throwable) {
        null
    }

    companion object {
        private val VIDEO_PACKAGES = setOf("com.google.android.youtube", "com.netflix.mediaclient", "com.amazon.avod.thirdpartyclient")
    }
}
