package com.divibisoul.soul

import android.app.ActivityManager
import android.content.Context
import android.net.ConnectivityManager
import android.os.BatteryManager
import android.os.Build
import org.json.JSONObject

/** Read-only native capabilities owned by N01. */
class SoulN01LocalCapabilities(private val context: Context) {
    fun deviceInfo(): JSONObject = JSONObject()
        .put("manufacturer", Build.MANUFACTURER)
        .put("model", Build.MODEL)
        .put("device", Build.DEVICE)
        .put("androidVersion", Build.VERSION.RELEASE)
        .put("sdk", Build.VERSION.SDK_INT)
        .put("package", context.packageName)

    fun battery(): JSONObject {
        val manager = context.getSystemService(BatteryManager::class.java)
        val level = manager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
        return JSONObject().put("level", level)
    }

    fun memory(): JSONObject {
        val manager = context.getSystemService(ActivityManager::class.java)
        val info = ActivityManager.MemoryInfo()
        manager?.getMemoryInfo(info)
        return JSONObject()
            .put("availableBytes", info.availMem)
            .put("totalBytes", info.totalMem)
            .put("lowMemory", info.lowMemory)
    }

    fun network(): JSONObject {
        val manager = context.getSystemService(ConnectivityManager::class.java)
        val network = manager?.activeNetwork
        val capabilities = network?.let { manager.getNetworkCapabilities(it) }
        return JSONObject()
            .put("connected", network != null)
            .put("validated", capabilities?.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true)
            .put("transportWifi", capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) == true)
            .put("transportCellular", capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) == true)
    }
}
