package com.divibisoul.soul

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
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
                    .put("message", result.message)
                    .put("percent", percent)
            }
            "clareira.android.kill_background" -> {
                val packageName = payload.optString("packageName", "").trim()
                require(packageName.isNotEmpty()) { "PACKAGE_NAME_REQUIRED" }
                val result = actions.killBackground(packageName)
                JSONObject()
                    .put("success", result.success)
                    .put("message", result.message)
                    .put("packageName", packageName)
            }
            "clareira.android.wifi_panel" -> {
                actions.openWifiPanel()
                JSONObject().put("success", true).put("action", capability)
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
            android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED)
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

        return JSONObject()
            .put("batteryPercent", batteryPercent)
            .put("charging", charging)
            .put("batteryTemperatureC", batteryTempC)
            .put("screenOn", power?.isInteractive ?: false)
            .put("network", network)
            .put("shizukuStatus", shizukuStatus)
            .put("timestamp", System.currentTimeMillis())
    }
}
