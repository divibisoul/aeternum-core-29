package com.divibisoul.soul.runtime

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.os.BatteryManager
import android.os.PowerManager
import com.divibisoul.soul.core.SoulEvent
import com.divibisoul.soul.core.SoulEventBus

class AndroidWatchdog(
    context: Context,
    private val bus: SoulEventBus,
    private val missionControl: MissionControl
) : ComponentCallbacks2 {

    private val appContext = context.applicationContext
    private var consecutiveSaraFailures = 0

    fun check(saraHealthy: Boolean = true) {
        val bm = appContext.getSystemService(BatteryManager::class.java)
        val level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        val pm = appContext.getSystemService(PowerManager::class.java)
        val thermal = if (android.os.Build.VERSION.SDK_INT >= 29) pm.currentThermalStatus else PowerManager.THERMAL_STATUS_NONE
        val memory = appContext.getSystemService(ActivityManager::class.java).let {
            ActivityManager.MemoryInfo().also(it::getMemoryInfo)
        }

        if (level in 0..10 || thermal >= PowerManager.THERMAL_STATUS_SEVERE || memory.lowMemory) {
            missionControl.pause("WATCHDOG_PROTECTIVE_PAUSE")
            bus.publish(
                SoulEvent.WatchdogAlert(
                    reason = "protective_pause",
                    batteryLevel = level,
                    thermalStatus = thermal,
                    lowMemory = memory.lowMemory
                )
            )
        }

        if (saraHealthy) consecutiveSaraFailures = 0 else consecutiveSaraFailures++
        if (consecutiveSaraFailures >= 3) {
            missionControl.pause("SARA_CONSECUTIVE_FAILURES")
            bus.publish(
                SoulEvent.WatchdogAlert(
                    reason = "sara_consecutive_failures",
                    batteryLevel = level,
                    thermalStatus = thermal,
                    lowMemory = memory.lowMemory
                )
            )
        }
    }

    override fun onTrimMemory(level: Int) {
        val critical = level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL
        if (critical) {
            missionControl.pause("TRIM_MEMORY_RUNNING_CRITICAL")
            bus.publish(
                SoulEvent.WatchdogAlert(
                    reason = "memory_pressure",
                    batteryLevel = -1,
                    thermalStatus = -1,
                    lowMemory = true
                )
            )
        }
    }

    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) = Unit
    override fun onLowMemory() {
        missionControl.pause("LOW_MEMORY")
    }
}
