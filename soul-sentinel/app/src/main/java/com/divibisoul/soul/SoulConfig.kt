package com.divibisoul.soul

import android.content.Context

class SoulConfig(context: Context) {
    private val prefs = context.getSharedPreferences("soul_config", Context.MODE_PRIVATE)
    var batteryThreshold: Int
        get() = prefs.getInt("batteryThreshold", 30)
        set(v) = prefs.edit().putInt("batteryThreshold", v.coerceIn(5, 95)).apply()
    var checkIntervalMs: Long
        get() = prefs.getLong("checkIntervalMs", 30_000L)
        set(v) = prefs.edit().putLong("checkIntervalMs", v.coerceIn(10_000L, 300_000L)).apply()
    var videoWifiRule: Boolean
        get() = prefs.getBoolean("videoWifiRule", true)
        set(v) = prefs.edit().putBoolean("videoWifiRule", v).apply()
    var nightRule: Boolean
        get() = prefs.getBoolean("nightRule", true)
        set(v) = prefs.edit().putBoolean("nightRule", v).apply()
    var lowBatteryRule: Boolean
        get() = prefs.getBoolean("lowBatteryRule", true)
        set(v) = prefs.edit().putBoolean("lowBatteryRule", v).apply()
    var enabled: Boolean
        get() = prefs.getBoolean("enabled", false)
        set(v) = prefs.edit().putBoolean("enabled", v).apply()

    /** Optional server-backed nucleus endpoints. Empty means no remote route is claimed. */
    var meshN02Endpoint: String
        get() = prefs.getString("meshN02Endpoint", "") ?: ""
        set(v) = prefs.edit().putString("meshN02Endpoint", v.trim()).apply()
    var meshN03Endpoint: String
        get() = prefs.getString("meshN03Endpoint", "") ?: ""
        set(v) = prefs.edit().putString("meshN03Endpoint", v.trim()).apply()
    var meshN04Endpoint: String
        get() = prefs.getString("meshN04Endpoint", "") ?: ""
        set(v) = prefs.edit().putString("meshN04Endpoint", v.trim()).apply()
    var meshN05Endpoint: String
        get() = prefs.getString("meshN05Endpoint", "") ?: ""
        set(v) = prefs.edit().putString("meshN05Endpoint", v.trim()).apply()
    var meshN06Endpoint: String
        get() = prefs.getString("meshN06Endpoint", "") ?: ""
        set(v) = prefs.edit().putString("meshN06Endpoint", v.trim()).apply()

    fun meshEndpoints(): Map<String, String> = listOf(
        "N02" to meshN02Endpoint,
        "N03" to meshN03Endpoint,
        "N04" to meshN04Endpoint,
        "N05" to meshN05Endpoint,
        "N06" to meshN06Endpoint,
    ).filter { it.second.isNotBlank() }.toMap()
}
