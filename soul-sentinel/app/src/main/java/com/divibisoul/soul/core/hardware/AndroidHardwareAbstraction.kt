package com.divibisoul.soul.core.hardware

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import org.tensorflow.lite.nnapi.NnApiDelegate
import java.io.File

data class HardwareSnapshot(
    val manufacturer: String,
    val model: String,
    val soc: String?,
    val cpuCores: Int,
    val apiLevel: Int,
    val hasNpu: Boolean,
    val thermalZones: List<String>,
    val batteryTempC: Double?,
    val batteryLevel: Int?
)

class AndroidHardwareAbstraction(private val context: Context) {
    fun detect() = HardwareSnapshot(
        manufacturer = Build.MANUFACTURER,
        model = Build.MODEL,
        soc = if (Build.VERSION.SDK_INT >= 31) {
            listOfNotNull(Build.SOC_MANUFACTURER, Build.SOC_MODEL).joinToString(" ").ifBlank { null }
        } else null,
        cpuCores = Runtime.getRuntime().availableProcessors(),
        apiLevel = Build.VERSION.SDK_INT,
        hasNpu = hasNnapiDelegate(),
        thermalZones = readThermalZones(),
        batteryTempC = getBatteryTemp(),
        batteryLevel = getBatteryLevel()
    )

    fun getBatteryTemp(): Double? = runCatching {
        val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val raw = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE) ?: Int.MIN_VALUE
        if (raw == Int.MIN_VALUE) null else raw / 10.0
    }.getOrNull()

    fun getThermalSnapshot(): List<String> {
        val pm = context.getSystemService(PowerManager::class.java)
        val status = if (Build.VERSION.SDK_INT >= 29) pm.currentThermalStatus.toString() else "UNAVAILABLE"
        return listOf("status=$status", "zones=${readThermalZones().size}")
    }

    fun hasNpu(): Boolean = hasNnapiDelegate()

    private fun getBatteryLevel(): Int? = runCatching {
        context.getSystemService(BatteryManager::class.java)
            .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            .takeIf { it >= 0 }
    }.getOrNull()

    private fun hasNnapiDelegate(): Boolean = runCatching {
        NnApiDelegate().close()
        true
    }.getOrDefault(false)

    private fun readThermalZones(): List<String> = runCatching {
        File("/sys/class/thermal").listFiles()
            ?.filter { it.name.startsWith("thermal_zone") }
            ?.mapNotNull { zone ->
                val type = runCatching { File(zone, "type").readText().trim() }.getOrNull()
                val temp = runCatching { File(zone, "temp").readText().trim() }.getOrNull()
                if (type != null || temp != null) "${type ?: zone.name}:${temp ?: "unavailable"}" else null
            } ?: emptyList()
    }.getOrDefault(emptyList())
}
