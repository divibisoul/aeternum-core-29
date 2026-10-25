package com.divibisoul.soul

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.app.ActivityManager
import android.os.BatteryManager
import android.os.PowerManager
import org.json.JSONObject

/**
 * Native Android executor for the Clareira subset that can be performed through
 * existing SOUL-owned APIs. Unsupported privileged operations fail explicitly.
 */
class ClareiraAndroidCapabilities(private val context: Context) {
    private val actions = SoulActions(context)

    fun execute(capability: String, payload: JSONObject = JSONObject()): JSONObject {
        return when (capability) {
            "clareira.android.snapshot" -> snapshot()
            "clareira.android.brightness" -> {
                val percent = payload.optInt("percent", -1)
                require(percent in 1..100) { "BRIGHTNESS_PERCENT_INVALID" }
                val result = actions.setBrightness(percent)
                JSONObject()
                    .put("success", result.success)
                    .put("executionStatus", if (result.success) "API_REQUEST_ACCEPTED" else "API_REQUEST_FAILED")
                    .put("message", result.message)
                    .put("percent", percent)
            }
            "clareira.android.kill_background" -> {
                val packageName = payload.optString("packageName", "").trim()
                require(packageName.isNotEmpty()) { "PACKAGE_NAME_REQUIRED" }
                val result = actions.killBackground(packageName)
                JSONObject()
                    .put("success", result.success)
                    .put("executionStatus", if (result.success) "PROCESS_STOP_REQUESTED" else "API_REQUEST_FAILED")
                    .put("message", result.message)
                    .put("packageName", packageName)
            }
            "clareira.android.wifi_panel" -> {
                actions.openWifiPanel()
                JSONObject().put("success", true).put("executionStatus", "ANDROID_INTENT_DISPATCHED").put("action", capability)
            }
            "clareira.android.bluetooth_request" -> {
                actions.requestBluetoothEnable()
                JSONObject().put("success", true).put("action", capability)
            }
            "clareira.android.airplane_settings" -> {
                actions.openAirplaneSettings()
                JSONObject().put("success", true).put("action", capability)
            }
            else -> JSONObject()
                .put("success", false)
                .put("error", "CLAREIRA_ANDROID_CAPABILITY_UNSUPPORTED")
                .put("capability", capability)
        }
    }

    private fun snapshot(): JSONObject {
        val batteryManager = context.getSystemService(BatteryManager::class.java)
        val batteryIntent = context.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )
        val batteryPercent = batteryManager
            ?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            ?.coerceIn(0, 100) ?: batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)?.coerceIn(0, 100) ?: -1
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val charging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
            status == BatteryManager.BATTERY_STATUS_FULL
        val batteryTempC = batteryIntent
            ?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, Int.MIN_VALUE)
            ?.takeIf { it != Int.MIN_VALUE }
            ?.div(10.0)

        val power = context.getSystemService(PowerManager::class.java)
        val connectivity = context.getSystemService(ConnectivityManager::class.java)
        val network = connectivity?.activeNetwork?.let { active ->
            connectivity.getNetworkCapabilities(active)
        }?.let { caps ->
            when {
                caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "Wi-Fi"
                caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "Mobile data"
                caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "Ethernet"
                else -> "Connected"
            }
        } ?: "Offline"

        val shizukuStatus = try {
            when {
                !rikka.shizuku.Shizuku.pingBinder() -> "UNAVAILABLE"
                rikka.shizuku.Shizuku.checkSelfPermission() ==
                    android.content.pm.PackageManager.PERMISSION_GRANTED -> "AUTHORIZED"
                else -> "NOT_AUTHORIZED"
            }
        } catch (_: Throwable) {
            "ERROR"
        }

        val memory = context.getSystemService(ActivityManager::class.java)
        val memoryInfo = ActivityManager.MemoryInfo().also { info ->
            memory?.getMemoryInfo(info)
        }
        val ramTotalMb = memoryInfo.totalMem.takeIf { it > 0 }?.div(1024L * 1024L)
        val ramAvailableMb = memoryInfo.availMem.takeIf { it >= 0 }?.div(1024L * 1024L)
        val ramUsedMb = if (ramTotalMb != null && ramAvailableMb != null) {
            (ramTotalMb - ramAvailableMb).coerceAtLeast(0)
        } else null
        val cpuFreqMhz = try {
            java.io.File("/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq")
                .takeIf { it.canRead() }
                ?.readText()
                ?.trim()
                ?.toLongOrNull()
                ?.div(1000.0)
        } catch (_: Throwable) {
            null
        }
        val foregroundPackage = try {
            SoulCortex(context, SoulConfig(context)).foregroundPackage()
        } catch (_: Throwable) {
            null
        }
        val bluetoothEnabled = try {
            context.getSystemService(android.bluetooth.BluetoothManager::class.java)
                ?.adapter?.isEnabled == true
        } catch (_: Throwable) {
            false
        }
        val wifiEnabled = try {
            context.getSystemService(android.net.wifi.WifiManager::class.java)
                ?.isWifiEnabled == true
        } catch (_: Throwable) {
            false
        }

        return JSONObject()
            .put("batteryPercent", batteryPercent)
            .put("charging", charging)
            .put("batteryTemperatureC", batteryTempC)
            .put("screenOn", power?.isInteractive ?: false)
            .put("network", network)
            .put("shizukuStatus", shizukuStatus)
            .put("cpuFreqMhz", cpuFreqMhz)
            .put("ramUsedMb", ramUsedMb)
            .put("ramTotalMb", ramTotalMb)
            .put("foregroundPackage", foregroundPackage)
            .put("wifiEnabled", wifiEnabled)
            .put("bluetoothEnabled", bluetoothEnabled)
            .put("timestamp", System.currentTimeMillis())
    }
}
