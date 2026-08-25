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
}
