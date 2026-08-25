package com.divibisoul.soul

import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.provider.Settings
import android.util.Log

class SoulActions(private val context: Context) {
    data class Result(val success: Boolean, val message: String)

    fun setBrightness(percent: Int): Result {
        if (!Settings.System.canWrite(context)) return Result(false, "WRITE_SETTINGS authorization required")
        val value = (percent.coerceIn(1, 100) * 255 / 100)
        Settings.System.putInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS, value)
        return Result(true, "Brightness set to $percent%")
    }

    fun openWifiPanel() {
        context.startActivity(Intent(Settings.Panel.ACTION_WIFI).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    fun requestBluetoothEnable() {
        context.startActivity(Intent(android.bluetooth.BluetoothAdapter.ACTION_REQUEST_ENABLE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    fun openAirplaneSettings() {
        context.startActivity(Intent(Settings.ACTION_AIRPLANE_MODE_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    fun killBackground(packageName: String): Result {
        return try {
            context.getSystemService(android.app.ActivityManager::class.java).killBackgroundProcesses(packageName)
            Result(true, "Requested background stop: $packageName")
        } catch (t: Throwable) {
            Log.e("SoulActions", "killBackground failed", t)
            Result(false, t.message ?: "background stop failed")
        }
    }

    fun wifiEnabled(): Boolean = context.getSystemService(WifiManager::class.java).isWifiEnabled
    fun bluetoothEnabled(): Boolean = context.getSystemService(BluetoothManager::class.java).adapter?.isEnabled == true
}
